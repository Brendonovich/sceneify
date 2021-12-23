import OBSWebSocket, {
  OutgoingMessage,
  PatchedOBSRequestTypes as OBSRequestTypes,
  PatchedOBSResponseTypes as OBSResponseTypes,
  SceneItemTransform,
} from "obs-websocket-js";

import { DeepPartial } from "../../src/types";
import { mergeDeep } from "../../src/utils";

const DEFAULT_SCENE_ITEM_TRANSFORM: SceneItemTransform = {
  positionX: 0,
  positionY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  alignment: 0,
  boundsAlignment: 0,
  sourceWidth: 0,
  sourceHeight: 0,
  width: 0,
  height: 0,
  boundsWidth: 0,
  boundsHeight: 0,
  boundsType: "OBS_BOUNDS_NONE",
};

class Filter {
  constructor(
    public name: string,
    public type: string,
    public settings: Record<string, any> = {}
  ) {}
}

class Input {
  instances: SceneItem[] = [];

  constructor(
    public obs: OBS,
    public name: string,
    public kind: string,
    public settings: Record<string, any> = {},
    public filters: Filter[] = []
  ) {}

  removeInstance(instance: SceneItem) {
    this.instances.splice(this.instances.indexOf(instance), 1);

    this.checkInstanceCount();
  }

  checkInstanceCount() {
    if (this.instances.length === 0) this.obs.removeInput(this);
  }
}

class SceneItem {
  constructor(
    public id: number,
    public input: Input,
    public scene: Scene,
    public transform: DeepPartial<SceneItemTransform> = {}
  ) {
    this.transform = {
      ...DEFAULT_SCENE_ITEM_TRANSFORM,
      ...transform,
    };

    scene.items.push(this);
    input.instances.push(this);
  }

  destroy() {
    this.input.removeInstance(this);
    this.scene.items.splice(this.scene.items.indexOf(this), 1);
  }
}

class Scene extends Input {
  items: SceneItem[] = [];

  private _id = 0;

  generateId() {
    return this._id++;
  }

  constructor(obs: OBS, name: string) {
    super(obs, name, "scene");
  }

  destroy() {
    this.items.forEach((i) => i.destroy());
  }

  override checkInstanceCount() {}
}

class OBS {
  scenes: Scene[] = [];
  inputs = new Set<Input>();

  constructor() {
    this.createScene("_");
  }

  get allInputs(): Input[] {
    return [...this.scenes, ...this.inputs];
  }

  createScene(name: string) {
    const scene = new Scene(this, name);
    this.scenes.push(scene);
    return scene;
  }

  removeScene(scene: string) {
    this.scenes = this.scenes.filter((s) => s.name !== scene);
  }

  removeInput(input: Input) {
    this.inputs.delete(input);
  }
}

export class MockOBSWebSocket extends OBSWebSocket {
  override protocol = "";

  OBS = new OBS();

  override async call<Type extends keyof OBSRequestTypes>(
    requestType: Type,
    requestData?: OBSRequestTypes[Type]
  ): Promise<OBSResponseTypes[Type]> {
    let ret: any;

    switch (requestType) {
      case "CreateScene": {
        const data = requestData as OBSRequestTypes["CreateScene"];
        this.OBS.createScene(data.sceneName);
        break;
      }

      case "RemoveScene": {
        const data = requestData as OBSRequestTypes["RemoveScene"];
        this.OBS.removeScene(data.sceneName);
        break;
      }

      case "CreateInput": {
        const data = requestData as OBSRequestTypes["CreateInput"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        const input = new Input(
          this.OBS,
          data.inputName,
          data.inputKind,
          data.inputSettings
        );

        this.OBS.inputs.add(input);

        const sceneItemId = scene.generateId();

        new SceneItem(sceneItemId, input, scene);

        ret = { sceneItemId };

        break;
      }

      case "GetInputSettings": {
        const data = requestData as OBSRequestTypes["GetInputSettings"];
        const input = [...this.OBS.allInputs].find(
          (i) => i.name === data.inputName
        );

        if (!input) throw new Error("Input not found");

        ret = {
          inputKind: input.kind,
          inputSettings: input.settings,
        };

        break;
      }

      case "SetInputSettings": {
        const data = requestData as OBSRequestTypes["SetInputSettings"];
        const input = [...this.OBS.allInputs].find(
          (i) => i.name === data.inputName
        );

        if (!input) throw new Error("Input not found");

        for (let key in data.inputSettings) {
          input.settings[key] = data.inputSettings[key];
        }

        break;
      }

      case "GetSceneItemTransform": {
        const data = requestData as OBSRequestTypes["GetSceneItemTransform"];

        const item = [...this.OBS.scenes]
          .find((s) => s.name === data.sceneName)
          ?.items.find((i) => i.id === data.sceneItemId);

        if (!item) throw new Error("Item not found");

        ret = { sceneItemTransform: item.transform };

        break;
      }

      case "SetSceneItemTransform": {
        const data = requestData as OBSRequestTypes["SetSceneItemTransform"];

        const item = [...this.OBS.scenes]
          .find((s) => s.name === data.sceneName)
          ?.items.find((i) => i.id === data.sceneItemId);

        if (!item) throw new Error("Item not found");

        item.transform = mergeDeep(item.transform, data.transform);

        break;
      }

      case "CreateSceneItem": {
        const data = requestData as OBSRequestTypes["CreateSceneItem"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        const input = [...this.OBS.allInputs].find(
          (i) => i.name === data.sourceName
        );

        if (!input) throw new Error("Input not found");

        const id = scene.generateId();

        new SceneItem(id, input, scene);

        ret = { sceneItemId: id };

        break;
      }

      case "RemoveSceneItem": {
        const data = requestData as OBSRequestTypes["RemoveSceneItem"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);

        if (!item) throw new Error("Item not found");

        item.destroy();

        break;
      }

      case "GetSceneItemList": {
        const data = requestData as OBSRequestTypes["GetSceneItemList"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        ret = {
          sceneItems: scene.items.map((item, index) => ({
            sceneItemId: item.id,
            sceneItemIndex: index,
            sourceName: item.input.name,
            sourceType:
              item instanceof Scene
                ? "OBS_SOURCE_TYPE_SCENE"
                : "OBS_SOURCE_TYPE_INPUT",
            inputKind: item.input.kind,
            isGroup: false,
          })),
        };

        break;
      }

      case "GetSceneList": {
        ret = {
          scenes: this.OBS.scenes.map((scene, index) => ({
            sceneName: scene.name,
            sceneIndex: index,
          })),
          currentProgramSceneName: "",
          currentPreviewSceneName: "",
        };

        break;
      }

      case "GetInputList": {
        ret = {
          inputs: [...this.OBS.inputs].map((input, index) => ({
            inputName: input.name,
            inputIndex: index,
            inputKind: input.kind,
          })),
        };

        break;
      }
    }

    return ret;
  }

  protected override async encodeMessage(_: OutgoingMessage): Promise<never> {
    throw new Error("OBSWebsocket.encodeMessage is not implemented");
  }

  protected override async decodeMessage(
    _: string | ArrayBuffer | Blob
  ): Promise<never> {
    throw new Error("OBSWebsocket.decodeMessage is not implemented");
  }
}
