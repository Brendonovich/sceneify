import ObsWebSocket, {
  PatchedOBSRequestTypes,
  PatchedOBSResponseTypes,
} from "obs-websocket-js";

import type { Scene } from "./Scene";
import { Source, ItemID, ItemRef, SceneName } from "./Source";

export class OBS {
  /**
   * The OBS websocket connection used internally
   */
  socket = new ObsWebSocket();

  /**
   * All of the sources that this OBS instance has access to, excluding scenes
   */
  inputs = new Map<string, Source>();

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

    this.inputs.clear();
    this.scenes.clear();
  }

  /**
   * Goes though each source in OBS and removes it if 1. simple-obs owns it and 2. there are no references
   * to the source in code.
   */
  async clean() {
    const { scenes } = await this.call("GetSceneList");
    const { inputs } = await this.call("GetInputList");

    const inputsSettings = await Promise.all(
      [
        ...scenes.map((s) => s.sceneName),
        ...inputs.map((i) => i.inputName),
      ].map(async (inputName) => {
        const { inputSettings } = await this.call("GetInputSettings", {
          inputName,
        });

        return {
          inputName,
          inputSettings,
        };
      })
    );

    const inputsRefs = inputsSettings.reduce(
      (acc, data) => ({
        ...acc,
        [data.inputName]:
          data.inputSettings.SIMPLE_OBS_LINKED !== undefined
            ? data.inputSettings.SIMPLE_OBS_REFS
            : undefined,
      }),
      {} as Record<string, Record<SceneName, Record<ItemRef, ItemID>>>
    );

    // Delete refs that are actually in use

    for (let [_, scene] of this.scenes) {
      for (let itemRef in scene.items) {
        let item = scene.items[itemRef];

        delete inputsRefs[item.source.name]?.[scene.name]?.[itemRef];
      }
    }

    const danglingItems = Object.values(inputsRefs)
      .filter((r) => r !== undefined)
      .reduce(
        (acc, inputRefs) => {
          let danglingInputItems = [];

          for (let [sceneName, refs] of Object.entries(inputRefs)) {
            for (let sceneItemId of Object.values(refs)) {
              if (inputRefs[sceneName] !== undefined)
                danglingInputItems.push({
                  sceneName,
                  sceneItemId,
                });
            }
          }

          return [...acc, ...danglingInputItems];
        },
        [] as {
          sceneName: string;
          sceneItemId: number;
        }[]
      );

    await Promise.all(
      danglingItems.map((data) => this.call("RemoveSceneItem", data))
    );

    const danglingOBSScenes = scenes.filter(
      ({ sceneName }) =>
        !this.scenes.has(sceneName) && inputsRefs[sceneName] !== undefined
    );

    await Promise.all(
      danglingOBSScenes.map(({ sceneName }) =>
        this.call("RemoveScene", { sceneName })
      )
    );

    for (let danglingCodeScene of this.scenes.keys()) {
      if (scenes.some(({ sceneName }) => sceneName === danglingCodeScene))
        this.scenes.delete(danglingCodeScene);
    }

    for (let danglingCodeInputs of this.inputs.keys()) {
      if (inputs.some(({ inputName }) => inputName === danglingCodeInputs))
        this.inputs.delete(danglingCodeInputs);
    }

    // TODO: Refresh filters
    await Promise.all([
      ...[...this.inputs.values()].map((input) => input.pushRefs()),
      ...[...this.scenes.values()].map((scene) => scene.pushRefs()),
    ]);
  }

  call<T extends keyof PatchedOBSRequestTypes>(
    requestType: T,
    requestData?: PatchedOBSRequestTypes[T]
  ): Promise<PatchedOBSResponseTypes[T]> {
    return this.socket.call(requestType as any, requestData as any);
  }
}
