import ObsWebSocket from "obs-websocket-js";

import type { Scene } from "../Scene";
import { Source, ItemID, ItemRef, SceneName } from "../Source";
import { wait } from "../utils";

export class OBS {
  /**
   * The OBS websocket connection used internally
   */
  socket = new ObsWebSocket();

  /**
   * All of the sources that this OBS instance has access to, excluding scenes
   */
  sources = new Map<string, Source>();

  /**
   * All of the scenes that this OBS instance has access to
   */
  scenes = new Map<string, Scene>();

  // @internal
  rpcVersion!: number;

  /**
   * Connect this OBS instance to a websocket
   */
  async connect(url: string, password?: string) {
    const data = await this.socket.connect(url, password);

    this.rpcVersion = data.negotiatedRpcVersion;

    this.sources.clear();
    this.scenes.clear();
  }

  /**
   * Goes though each source in OBS and removes it if 1. simple-obs owns it and 2. there are no references
   * to the source in code.
   */
  // async clean() {
    // const { scenes: obsScenes } = await this.socket.call("GetSceneList");
  //   const { inputs: obsInputs } = await this.socket.call("GetInputList");

  //   const obsSourcesRefs = (
  //     await Promise.all(
  //       obsSources
  //         .map((source) =>
  //           this.getSourceSettings({ name: source.name, type: source.typeId })
  //         )
  //         .concat(
  //           obsScenes.map((source) =>
  //             this.getSourceSettings({ name: source.name, type: "scene" })
  //           )
  //         )
  //     )
  //   ).reduce(
  //     (acc, data) => ({
  //       ...acc,
  //       [data.sourceName]: data.sourceSettings.SIMPLE_OBS_LINKED
  //         ? undefined
  //         : data.sourceSettings.SIMPLE_OBS_REFS,
  //     }),
  //     {} as Record<string, Record<SceneName, Record<ItemRef, ItemID>>>
  //   );

  //   // Delete refs that are actually in use
  //   for (let scene of this.scenes.values()) {
  //     for (let [ref, item] of Object.entries(scene.items)) {
  //       delete obsSourcesRefs[item.source.name]?.[scene.name]?.[ref];
  //     }
  //   }

  //   let promises: Promise<any>[] = [];

  //   // Delete scene items of sources that are not present in code
  //   for (let [sourceName, sourceRefs] of Object.entries(obsSourcesRefs).filter(
  //     ([, v]) => v !== undefined
  //   )) {
  //     for (let [scene, refs] of Object.entries(sourceRefs)) {
  //       for (let id of Object.values(refs)) {
  //         if (obsSourcesRefs[scene] !== undefined)
  //           promises.push(
  //             obs.deleteSceneItem({
  //               scene,
  //               id,
  //               name: sourceName,
  //             })
  //           );
  //       }
  //     }
  //   }

  //   // Filter out scenes for deletion that are not in use and we own
  //   const spareObsScenes = obsScenes.filter(
  //     (scene) =>
  //       !this.scenes.has(scene.name) && obsSourcesRefs[scene.name] !== undefined
  //   );

  //   await Promise.all(promises);

  //   await wait(50);

  //   await Promise.all(
  //     spareObsScenes.map((scene) => this.removeScene(scene.name))
  //   );

  //   for (let codeScene of [...this.scenes.keys()]) {
  //     if (obsScenes.find((s) => s.name === codeScene) === undefined)
  //       this.scenes.delete(codeScene);
  //   }

  //   for (let codeSource of [...this.sources.keys()]) {
  //     if (obsSources.find((s) => s.name === codeSource) === undefined)
  //       this.sources.delete(codeSource);
  //   }

  //   await Promise.all<any>([
  //     ...[...this.sources.values()].map(async (source) => {
  //       await source.pushRefs();
  //       if (!source.linked) await source.refreshFilters();
  //     }),
  //     ...[...this.scenes.values()].map((scene) => scene.pushRefs()),
  //   ]);

  //   // Let obs catch up - #21
  //   await wait(100);
  // }
}