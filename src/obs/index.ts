import WebSocket from "isomorphic-ws";
import EventEmitter from "eventemitter3";
import { nanoid } from "nanoid";

import { RequestArgsMap, RequestResponseMap, EventsDataMap } from "./socket";
import { Scene } from "../Scene";
import { Source } from "../Source";
import { SceneItemProperties } from "../SceneItem";
import { DeepPartial } from "../types";

let requestCounter = 0;
function generateMessageId() {
  return (requestCounter++).toString();
}

interface ConnectArgs {
  address?: string;
}

export const PROCESS_ID = nanoid();

const emitter = new EventEmitter();

class OBS {
  #socket: WebSocket | null = null;

  LOGGING: boolean = true;

  sources = new Map<string, Source>();
  scenes = new Map<string, Scene>();

  connect(args: ConnectArgs) {
    this.sources.clear();
    try {
      this.#socket?.close();
    } catch {}

    const socket = new WebSocket(`ws://${args.address}`);
    this.#socket = socket;

    let settled = false;

    return new Promise<void>((resolve) => {
      socket.onopen = async () => {
        if (settled) return;

        settled = true;

        emitter.emit("ConnectionOpened");

        emitter.on("SceneItemTransformChanged", (data) => {
          emitter.emit(
            `SceneItemTransformChanged:${data["scene-name"]}:${data["item-id"]}`,
            data.transform
          );
        });

        resolve();
      };
      socket.onmessage = (msg) => {
        const message = JSON.parse(msg.data.toString());

        let err, data;

        if (message.status === "error") err = message;
        else data = message;

        if (message["message-id"]) {
          emitter.emit(
            `obs:internal:message:id-${message["message-id"]}`,
            err,
            data
          );
        } else if (message["update-type"]) {
          emitter.emit(message["update-type"], data);
        } else {
          emitter.emit("message", message);
        }
      };
    });
  }

  // async clean() {
  //   const { scenes: obsScenes } = await this.getSceneList();

  //   const spareCodeSources = [...this.sources.entries()].filter(
  //     ([, source]) =>
  //       !(source instanceof Scene) &&
  //       obsScenes
  //         .find((s) => s.name === source.item?.scene.name)
  //         ?.sources.find(
  //           (i) => i.name === source.name && i.type === source.type
  //         )
  //   );

  //   const spareObsSources = obsScenes.reduce<
  //     { scene: string; source: { type: string; name: string; id: number } }[]
  //   >(
  //     (acc, scene) => [
  //       ...acc,
  //       ...scene.sources
  //         .filter(
  //           (source) =>
  //             this.sources.get(source.name) === undefined &&
  //             source.name[0] !== "#"
  //         )
  //         .map((source) => ({
  //           scene: scene.name,
  //           source,
  //         })),
  //     ],
  //     []
  //   );

  //   const spareObsScenes = obsScenes.filter(
  //     (scene) =>
  //       this.sources.get(scene.name) === undefined && scene.name[0] !== "#"
  //   );

  //   await Promise.all([
  //     ...spareObsSources.map(async ({ scene, source }) => {
  //       if (source.type === "scene") await this.removeScene(source.name);
  //       else
  //         await this.deleteSceneItem({
  //           scene: scene,
  //           id: source.id,
  //         });
  //     }),
  //     ...spareObsScenes.map(async (scene) => {
  //       await this.removeScene(scene.name);
  //     }),
  //   ]);

  //   await Promise.all(
  //     [...this.sources.values()].map((source) => source.refreshFilters())
  //   );
  // }

  disconnect() {
    this.#socket?.close();
  }

  batchedSends: object[] = [];

  async sendBatch() {
    const id = generateMessageId();

    if (
      this.batchedSends.filter((a) => {
        const data = JSON.stringify(a);
        return (
          data.includes("AddSceneItem") || data.includes("DeleteSceneItem")
        );
      }).length > 0
    ) {
      console.info(this.batchedSends);
    }
    this.#socket?.send(
      JSON.stringify({
        "request-type": "ExecuteBatch",
        requests: this.batchedSends,
        "message-id": id,
      })
    );

    emitter.once(`obs:internal:message:id-${id}`, (err, data) => {
      if (err) console.warn(err);
      else {
        data.results.forEach((res: any) => {
          emitter.emit(
            `obs:internal:message:id-${res["message-id"]}`,
            res.status === "error" ? res : undefined,
            res.status !== "error" ? res : undefined
          );
        });
      }
    });

    this.batchedSends = [];
    this.queued = false;
  }

  queued = false;
  queueSendBatch() {
    if (this.queued) return;
    process.nextTick(() => this.sendBatch());
    this.queued = true;
  }

  batchSend(data: object) {
    this.batchedSends.push(data);
    this.queueSendBatch();
  }

  send<T extends keyof RequestArgsMap>(
    type: T,
    ...[args]: RequestArgsMap[T] extends object
      ? [RequestArgsMap[T]]
      : [undefined?]
  ): Promise<RequestResponseMap[T]> {
    return new Promise((resolve, reject) => {
      const id = generateMessageId();
      emitter.once(`obs:internal:message:id-${id}`, (err, data) => {
        if (err) reject({ ...err, type, args });
        else resolve(data);
      });

      this.batchSend({
        ...args,
        "request-type": type,
        "message-id": id,
      });
    });
  }

  on<T extends keyof EventsDataMap>(
    type: T,
    listener: (data: EventsDataMap[T]) => void
  ) {
    return emitter.on(type, listener);
  }

  off<T extends keyof EventsDataMap>(
    type: T,
    listener: (data: EventsDataMap[T]) => void
  ) {
    return emitter.off(type, listener);
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
    return this.send("GetVideoInfo", {})
  }

  log(...messages: any[]) {
    if (!obs.LOGGING) return;
    console.log(`OBS: `, ...messages);
  }
}

export const obs = new OBS();
