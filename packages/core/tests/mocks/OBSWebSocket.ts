import {
  DEFAULT_SCENE_ITEM_TRANSFORM,
  OBSRequestTypes,
  OBSResponseTypes,
  SceneItemTransform,
  DeepPartial,
} from "../../";
import { mergeDeep } from "../../src/utils";

class Filter {
  constructor(
    public name: string,
    public kind: string,
    public settings: Record<string, any> = {},
    public enabled = true
  ) {}

  input!: Input;

  get index() {
    return this.input.filters.indexOf(this);
  }
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

  addFilter(filter: Filter, index?: number) {
    this.filters.splice(index ?? this.filters.length, 0, filter);
    filter.input = this;
  }

  removeFilter(filter: Filter) {
    this.filters.splice(filter.index, 1);
  }
}

class SceneItem {
  enabled = true;
  locked = true

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

export class MockOBSWebSocket {
  OBS = new OBS();

  async call<Type extends keyof OBSRequestTypes>(
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

      case "GetSourceFilterList": {
        const data = requestData as OBSRequestTypes["GetSourceFilterList"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        ret = {
          filters: source.filters.map((filter) => ({
            filterName: filter.name,
            filterEnabled: filter.enabled,
            filterIndex: filter.index,
            filterKind: filter.kind,
            filterSettings: filter.settings,
          })),
        };

        break;
      }

      case "CreateSourceFilter": {
        const data = requestData as OBSRequestTypes["CreateSourceFilter"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = new Filter(
          data.filterName,
          data.filterKind,
          data.filterSettings
        );

        source.addFilter(filter, data.filterIndex);

        break;
      }

      case "RemoveSourceFilter": {
        const data = requestData as OBSRequestTypes["RemoveSourceFilter"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);

        if (!filter) throw new Error("Filter not found");

        source.removeFilter(filter);

        break;
      }

      case "GetSourceFilterDefaultSettings": {
        ret = { filterSettings: {} };

        break;
      }

      case "GetSourceFilter": {
        const data = requestData as OBSRequestTypes["GetSourceFilter"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);

        if (!filter) throw new Error("Filter not found");

        ret = {
          filterName: filter.name,
          filterEnabled: filter.enabled,
          filterIndex: filter.index,
          filterKind: filter.kind,
          filterSettings: filter.settings,
        };

        break;
      }

      case "SetSourceFilterIndex": {
        const data = requestData as OBSRequestTypes["SetSourceFilterIndex"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);

        if (!filter) throw new Error("Filter not found");

        source.filters.splice(filter.index, 1);
        source.filters.splice(data.filterIndex, 0, filter);

        break;
      }

      case "SetSourceFilterSettings": {
        const data = requestData as OBSRequestTypes["SetSourceFilterSettings"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);

        if (!filter) throw new Error("Filter not found");

        for (let settingKey in data.filterSettings) {
          filter.settings[settingKey] = data.filterSettings[settingKey];
        }

        break;
      }

      case "SetSourceFilterEnabled": {
        const data = requestData as OBSRequestTypes["SetSourceFilterEnabled"];

        const source = [...this.OBS.inputs].find(
          (i) => i.name === data.sourceName
        );

        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);

        if (!filter) throw new Error("Filter not found");

        filter.enabled = data.filterEnabled;

        break;
      }

      case "GetSceneItemEnabled": {
        const data = requestData as OBSRequestTypes["GetSceneItemEnabled"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);

        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemEnabled: item.enabled,
        };

        break;
      }

      case "GetSceneItemLocked": {
        const data = requestData as OBSRequestTypes["GetSceneItemLocked"];

        const scene = [...this.OBS.scenes].find(
          (s) => s.name === data.sceneName
        );

        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);

        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemLocked: item.locked,
        };

        break;
      }
    }

    return ret;
  }
}
