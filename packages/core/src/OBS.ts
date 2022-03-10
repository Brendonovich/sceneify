import ObsWebSocket, { EventSubscription } from "obs-websocket-js";

import { OBSEventTypes, OBSRequestTypes, OBSResponseTypes } from "./types";
import { Scene } from "./Scene";
import { Input } from "./Input";
import { SourceRefs } from "./Source";

export class OBS {
  /**
   * The OBS websocket connection used internally
   */
  socket = new ObsWebSocket();

  /**
   * All of the sources that this OBS instance has access to, excluding scenes
   */
  inputs = new Map<string, Input>();

  /**
   * All of the scenes that this OBS instance has access to
   */
  scenes = new Map<string, Scene>();

  /** @internal */
  rpcVersion!: number;

  /**
   * Connect this OBS instance to a websocket
   */
  async connect(url: string, password?: string) {
    const data = await this.socket.connect(url, password, {
      eventSubscriptions:
        EventSubscription.Scenes |
        EventSubscription.Inputs |
        EventSubscription.Filters |
        EventSubscription.SceneItems,
    });

    this.rpcVersion = data.negotiatedRpcVersion;

    this.inputs.clear();
    this.scenes.clear();
  }

  /**
   * Goes though each source in OBS and removes it if Sceneify owns it,
   * and there are no references to the source in code.
   */
  async clean() {
    const { scenes } = await this.call("GetSceneList");
    const { inputs } = await this.call("GetInputList");

    const sourcesSettings = await Promise.all(
      [
        ...scenes.map((s) => s.sceneName),
        ...inputs.map((i) => i.inputName),
      ].map(async (sourceName) => {
        const { sourceSettings } = await this.call("GetSourcePrivateSettings", {
          sourceName,
        });

        return {
          sourceName,
          sourceSettings,
        };
      })
    );

    const sourcesRefs = sourcesSettings.reduce(
      (acc, data) => ({
        ...acc,
        ...(data.sourceSettings.SCENEIFY_LINKED === false &&
        data.sourceSettings.SCENEIFY_REFS
          ? { [data.sourceName]: data.sourceSettings.SCENEIFY_REFS }
          : {}),
      }),
      {} as Record<string, SourceRefs>
    );

    // Delete refs that are actually in use
    for (let [_, scene] of this.scenes) {
      for (let item of scene.items) {
        delete sourcesRefs[item.source.name]?.[scene.name]?.[item.ref];

        if (
          Object.keys(sourcesRefs[item.source.name]?.[scene.name] ?? {})
            .length === 0
        ) {
          delete sourcesRefs[item.source.name]?.[scene.name];
        }

        if (Object.keys(sourcesRefs[item.source.name] ?? {}).length === 0) {
          delete sourcesRefs[item.source.name];
        }
      }
    }

    const danglingItems = Object.values(sourcesRefs)
      .filter((r) => r !== undefined)
      .reduce(
        (acc, sourceRefs) => {
          let danglingInputItems = [];

          for (let [sceneName, refs] of Object.entries(sourceRefs)) {
            for (let sceneItemId of Object.values(refs)) {
              if (sourceRefs[sceneName] !== undefined)
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
        !this.scenes.has(sceneName) && sourcesRefs[sceneName] !== undefined
    );

    await Promise.all(
      danglingOBSScenes.map(({ sceneName }) =>
        this.call("RemoveScene", { sceneName })
      )
    );

    for (let danglingCodeScene of this.scenes.keys()) {
      if (scenes.every(({ sceneName }) => sceneName !== danglingCodeScene))
        this.scenes.delete(danglingCodeScene);
    }

    for (let danglingCodeInputs of this.inputs.keys()) {
      if (inputs.every(({ inputName }) => inputName !== danglingCodeInputs))
        this.inputs.delete(danglingCodeInputs);
    }

    // TODO: Refresh filters
    await Promise.all([
      ...[...this.inputs.values()].map((input) => input.pushRefs()),
      ...[...this.scenes.values()].map((scene) => scene.pushRefs()),
    ]);
  }

  call<T extends keyof OBSRequestTypes>(
    requestType: T,
    requestData?: OBSRequestTypes[T]
  ): Promise<OBSResponseTypes[T]> {
    return this.socket.call(requestType as any, requestData as any);
  }

  on<T extends keyof OBSEventTypes>(
    event: T,
    callback: (data: OBSEventTypes[T]) => void
  ) {
    this.socket.on(event, callback as any);
    return this;
  }

  off<T extends keyof OBSEventTypes>(
    event: T,
    callback: (data: OBSEventTypes[T]) => void
  ) {
    this.socket.off(event, callback as any);
  }

  /**
   * Streaming state
   */

  streaming = false;

  async startStreaming() {
    await this.call("StartStream");

    this.streaming = true;
  }

  async stopStreaming() {
    await this.call("StopStream");

    this.streaming = false;
  }

  async toggleStreaming() {
    const { outputActive } = await this.call("ToggleStream");

    this.streaming = outputActive;
  }
}
