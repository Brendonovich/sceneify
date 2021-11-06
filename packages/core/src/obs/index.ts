import ObsWebSocket from "obs-websocket-js";
import nextTick from "next-tick";

import type { Scene } from "../Scene";
import { RequestArgsMap, RequestResponseMap, EventsDataMap } from "./socket";
import { Source, ItemID, ItemRef, SceneName } from "../Source";
import { DeepPartial } from "../types";
import { wait } from "../utils";
import { SceneItemProperties } from "../SceneItem";

let requestCounter = 0;
function generateMessageId() {
  return (requestCounter++).toString();
}

interface ConnectArgs {
  address?: string;
  password?: string;
  secure?: boolean;
}

class OBS {
  socket = new ObsWebSocket();

  LOGGING: boolean = true;

  sources = new Map<string, Source>();
  scenes = new Map<string, Scene>();

  /**
   * Set this to true at your own peril. While batching should work, it is untested and
   * sometimes results in requests never being returned as complete.
   */
  useBatching = false;

  async connect(args: ConnectArgs) {
    await this.socket.connect(args);

    this.sources.clear();
    this.scenes.clear();

    this.socket.on("SceneItemTransformChanged", (data) => {
      this.socket.emit(
        `SceneItemTransformChanged:${data["scene-name"]}:${data["item-id"]}`,
        data.transform
      );
    });
  }

  clear() {
    this.sources.clear();
    this.scenes.clear();
  }

  disconnect() {
    this.socket.removeAllListeners();
    this.socket.disconnect();
    
    this.clear();
  }

  /**
   * Goes though each source in OBS and removes it if 1. simple-obs owns it and 2. there are no references
   * to the source in code.
   */
  async clean() {
    const { scenes: obsScenes } = await this.getSceneList();
    const { sources: obsSources } = await this.getSourcesList();

    const obsSourcesRefs = (
      await Promise.all(
        obsSources
          .map((source) =>
            this.getSourceSettings({ name: source.name, type: source.typeId })
          )
          .concat(
            obsScenes.map((source) =>
              this.getSourceSettings({ name: source.name, type: "scene" })
            )
          )
      )
    ).reduce(
      (acc, data) => ({
        ...acc,
        [data.sourceName]: data.sourceSettings.SIMPLE_OBS_LINKED
          ? undefined
          : data.sourceSettings.SIMPLE_OBS_REFS,
      }),
      {} as Record<string, Record<SceneName, Record<ItemRef, ItemID>>>
    );

    // Delete refs that are actually in use
    for (let scene of this.scenes.values()) {
      for (let [ref, item] of Object.entries(scene.items)) {
        delete obsSourcesRefs[item.source.name]?.[scene.name]?.[ref];
      }
    }

    let promises: Promise<any>[] = [];

    // Delete scene items of sources that are not present in code
    for (let [sourceName, sourceRefs] of Object.entries(obsSourcesRefs).filter(
      ([, v]) => v !== undefined
    )) {
      for (let [scene, refs] of Object.entries(sourceRefs)) {
        for (let id of Object.values(refs)) {
          if (obsSourcesRefs[scene] !== undefined)
            promises.push(
              obs.deleteSceneItem({
                scene,
                id,
                name: sourceName,
              })
            );
        }
      }
    }

    // Filter out scenes for deletion that are not in use and we own
    const spareObsScenes = obsScenes.filter(
      (scene) =>
        !this.scenes.has(scene.name) && obsSourcesRefs[scene.name] !== undefined
    );

    await Promise.all(promises);

    await wait(50);

    await Promise.all(
      spareObsScenes.map((scene) => this.removeScene(scene.name))
    );

    for (let codeScene of [...this.scenes.keys()]) {
      if (obsScenes.find((s) => s.name === codeScene) === undefined)
        this.scenes.delete(codeScene);
    }

    for (let codeSource of [...this.sources.keys()]) {
      if (obsSources.find((s) => s.name === codeSource) === undefined)
        this.sources.delete(codeSource);
    }

    await Promise.all<any>([
      ...[...this.sources.values()].map(async (source) => {
        await source.pushRefs();
        if (!source.linked) await source.refreshFilters();
      }),
      ...[...this.scenes.values()].map((scene) => scene.pushRefs()),
    ]);

    // Let obs catch up - #21
    await wait(100);
  }

  batchedSends: {
    "request-type": string;
    "message-id": string;
    [key: string]: any;
  }[] = [];

  async sendBatch() {
    const data = await this.socket.send("ExecuteBatch", {
      requests: this.batchedSends,
    });

    data.results.forEach((res: any) => {
      this.socket.emit(
        `simple-obs:internal:message:id-${res["message-id"]}`,
        res.status === "error" ? res : undefined,
        res.status !== "error" ? res : undefined
      );
    });

    this.batchedSends = [];
    this.queued = false;
  }

  queued = false;
  queueSendBatch() {
    if (this.queued) return;

    nextTick(() => this.sendBatch());
    this.queued = true;
  }

  batchSend(data: object) {
    this.batchedSends.push(data as any);
    this.queueSendBatch();
  }

  send<T extends keyof RequestArgsMap>(
    type: T,
    ...[args]: RequestArgsMap[T] extends object
      ? [RequestArgsMap[T]]
      : [undefined?]
  ): Promise<RequestResponseMap[T]> {
    if (this.useBatching)
      return new Promise((resolve, reject) => {
        const id = generateMessageId();

        this.socket.once(
          `simple-obs:internal:message:id-${id}`,
          (err, data) => {
            if (err) reject({ ...err, type, args });
            else resolve(data);
          }
        );

        this.batchSend({
          ...args,
          "request-type": type,
          "message-id": id,
        });
      });
    else return this.socket.send(type as any, args);
  }

  on<T extends keyof EventsDataMap>(
    type: T,
    listener: (data: EventsDataMap[T]) => void
  ) {
    // @ts-expect-error Overriding base types
    return this.socket.on(type, listener);
  }

  off<T extends keyof EventsDataMap>(
    type: T,
    listener: (data: EventsDataMap[T]) => void
  ) {
    return this.socket.off(type, listener);
  }

  setSourceSettings(args: { name: string; type: string; settings: object }) {
    return this.send("SetSourceSettings", {
      sourceName: args.name,
      sourceType: args.type,
      sourceSettings: args.settings,
    });
  }

  createSource(args: {
    name: string;
    type: string;
    scene?: string;
    settings: Record<string, any> & { visible?: boolean };
  }) {
    const { visible, ...settings } = args.settings;

    return this.send("CreateSource", {
      sourceName: args.name,
      sourceKind: args.type,
      sceneName: args.scene,
      sourceSettings: settings,
      setVisible: visible,
    });
  }

  createScene(name: string) {
    return this.send("CreateScene", {
      sceneName: name,
    });
  }

  async removeScene(name: string) {
    const sceneList = (await this.getSceneList()).scenes;
    // TODO Potentially remove in the future with OBS-WS release
    await Promise.all(
      sceneList.reduce(
        (acc, scene) => [
          ...acc,
          ...scene.sources.map((sceneItem) =>
            sceneItem.name === name
              ? this.deleteSceneItem({ scene: scene.name, name: name })
              : Promise.resolve()
          ),
        ],
        [] as Promise<any>[]
      )
    );

    const { sceneItems } = await this.getSceneItemList(name);
    sceneItems.forEach(async (sceneItem) => {
      await this.deleteSceneItem({
        scene: name,
        id: sceneItem.itemId,
        name: sceneItem.sourceName,
      });
    });

    await this.send("RemoveScene", {
      sceneName: name,
    });

    return;
  }

  getSceneItemList(sceneName: string) {
    return this.send("GetSceneItemList", { sceneName });
  }

  addSceneItem(args: { scene: string; source: string; visible?: boolean }) {
    return this.send("AddSceneItem", {
      sceneName: args.scene,
      sourceName: args.source,
      setVisible: args.visible,
    });
  }

  setSceneItemProperties({
    scene,
    name,
    id,
    position,
    bounds,
    crop,
    scale,
    ...properties
  }: {
    scene: string;
    name?: string;
    id?: number;
  } & DeepPartial<SceneItemProperties>) {
    let item = id ? { id } : name!;

    return this.send("SetSceneItemProperties", {
      "scene-name": scene,
      item,
      position: position ?? {},
      scale: scale ?? {},
      bounds: bounds ?? {},
      crop: crop ?? {},
      ...properties,
    });
  }

  setCurrentScene(scene: string) {
    return this.send("SetCurrentScene", {
      "scene-name": scene,
    });
  }

  getSceneItemProperties({
    id,
    name,
    scene,
  }: {
    scene: string;
    name?: string;
    id?: number;
  }) {
    let item = id ? { id } : name!;

    return this.send("GetSceneItemProperties", {
      "scene-name": scene,
      item,
    });
  }

  getSourceSettings(args: { name: string; type?: string }) {
    return this.send("GetSourceSettings", {
      sourceName: args.name,
      sourceType: args.type,
    });
  }

  getSceneList() {
    return this.send("GetSceneList", {});
  }

  deleteSceneItem({
    scene,
    name,
    id,
  }: {
    scene: string;
    name?: string;
    id?: number;
  }) {
    let item = id ? { id } : name!;

    return this.send("DeleteSceneItem", {
      scene,
      item,
    });
  }

  addFilterToSource({
    source,
    name,
    type,
    settings,
  }: {
    source: string;
    name: string;
    type: string;
    settings: any;
  }) {
    return this.send("AddFilterToSource", {
      sourceName: source,
      filterName: name,
      filterType: type,
      filterSettings: settings,
    });
  }

  setSourceFilterSettings({
    source,
    filter,
    settings,
  }: {
    source: string;
    filter: string;
    settings: object;
  }) {
    return this.send("SetSourceFilterSettings", {
      sourceName: source,
      filterName: filter,
      filterSettings: settings,
    });
  }

  setSourceFilterVisibility({
    source,
    filter,
    visible,
  }: {
    source: string;
    filter: string;
    visible: boolean;
  }) {
    return this.send("SetSourceFilterVisibility", {
      sourceName: source,
      filterName: filter,
      filterEnabled: visible,
    });
  }

  removeFilterFromSource({
    source,
    filter,
  }: {
    source: string;
    filter: string;
  }) {
    return this.send("RemoveFilterFromSource", {
      sourceName: source,
      filterName: filter,
    });
  }

  getSourceFilters({ source }: { source: string }) {
    return this.send("GetSourceFilters", { sourceName: source });
  }

  reorderSourceFilter({
    source,
    filter,
    newIndex,
  }: {
    source: string;
    filter: string;
    newIndex: number;
  }) {
    return this.send("ReorderSourceFilter", {
      sourceName: source,
      filterName: filter,
      newIndex,
    });
  }

  getSourceFilterInfo({ source, filter }: { source: string; filter: string }) {
    return this.send("GetSourceFilterInfo", {
      sourceName: source,
      filterName: filter,
    });
  }

  reorderSceneItems({ scene, items }: { scene: string; items: number[] }) {
    return this.send("ReorderSceneItems", {
      scene,
      items: items.map((id) => ({ id })),
    });
  }

  getSourcesList() {
    return this.send("GetSourcesList", {});
  }

  getSourceTypesList() {
    return this.send("GetSourceTypesList", {});
  }

  getVideoInfo() {
    return this.send("GetVideoInfo", {});
  }

  log(...messages: any[]) {
    if (!obs.LOGGING) return;
    console.log(`OBS: `, ...messages);
  }
}

export const obs = new OBS();
