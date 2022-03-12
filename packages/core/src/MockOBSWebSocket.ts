import { DEFAULT_SCENE_ITEM_TRANSFORM, MonitoringType } from "./constants";
import {
  DeepPartial,
  OBSRequestTypes,
  OBSResponseTypes,
  SceneItemTransform,
  Settings,
} from "./types";
import { removeUndefinedValues } from "./utils";

class Filter {
  constructor(
    public name: string,
    public kind: string,
    public settings: Record<string, any> = {},
    public enabled = true
  ) {}

  source!: Source;

  get index() {
    return this.source.filters.indexOf(this);
  }
}

abstract class Source {
  privateSettings: Settings = {};
  instances: SceneItem[] = [];

  constructor(
    public obs: OBS,
    public name: string,
    public kind: string,
    public settings: Record<string, any> = {},
    public filters: Filter[] = []
  ) {}

  addFilter(filter: Filter) {
    this.filters.push(filter);
    filter.source = this;
  }

  removeFilter(filter: Filter) {
    this.filters.splice(filter.index, 1);
  }

  removeInstance(instance: SceneItem) {
    this.instances.splice(this.instances.indexOf(instance), 1);
  }

  setPrivateSettings(settings: Settings) {
    for (let setting in settings) {
      this.privateSettings[setting] = settings[setting];
    }
  }

  remove() {
    this.instances.forEach((i) => i.remove());
  }
}

class Input extends Source {
  audioMonitorType = MonitoringType.None;
  audioSyncOffset = 0;
  muted = false;
  volume = {
    db: 0,
    mul: 0,
  };

  override removeInstance(instance: SceneItem) {
    super.removeInstance(instance);

    if (this.instances.length === 0) this.remove();
  }

  override remove() {
    super.remove();

    this.obs.removeInput(this.name);
  }
}

class Scene extends Source {
  items: SceneItem[] = [];

  private _id = 0;

  generateId() {
    return this._id++;
  }

  constructor(obs: OBS, name: string) {
    super(obs, name, "scene");
  }

  override remove() {
    super.remove();

    this.obs.removeScene(this.name);
    this.items.forEach((i) => i.remove());
  }
}

class SceneItem {
  enabled = true;
  locked = false;

  constructor(
    public id: number,
    public source: Source,
    public scene: Scene,
    public transform: DeepPartial<SceneItemTransform> = {}
  ) {
    this.transform = {
      ...DEFAULT_SCENE_ITEM_TRANSFORM,
      ...transform,
    };

    scene.items.push(this);
    source.instances.push(this);
  }

  remove() {
    this.source.removeInstance(this);
    this.scene.items.splice(this.scene.items.indexOf(this), 1);
  }
}

class OBS {
  scenes = new Map<string, Scene>();
  inputs = new Map<string, Input>();
  sources = new Map<string, Source>();

  streamStatus: OBSResponseTypes["GetStreamStatus"] = {
    outputActive: false,
    outputReconnecting: false,
    outputTimecode: "",
    outputDuration: 0,
    outputBytes: 0,
    outputSkippedFrames: 0,
    outputTotalFrames: 0,
  };

  currentScenes = {
    program: "",
    preview: "",
  };

  createScene(name: string) {
    const scene = new Scene(this, name);
    this.scenes.set(name, scene);
    this.sources.set(name, scene);
    return scene;
  }

  addInput(input: Input) {
    if (this.inputs.has(input.name))
      throw new Error(
        `Failed to add input ${input.name}: An input with this name already exists.`
      );

    this.inputs.set(input.name, input);
    this.sources.set(input.name, input);
  }

  removeScene(name: string) {
    this.scenes.delete(name);
    this.sources.delete(name);
  }

  removeInput(name: string) {
    this.inputs.delete(name);
    this.sources.delete(name);
  }
}

export class MockOBSWebSocket {
  obs = new OBS();

  connect(url: string, password: string, subscriptions: any) {
    return {
      rpcVersion: 1,
    };
  }

  async call<Type extends keyof OBSRequestTypes>(
    requestType: Type,
    requestData?: OBSRequestTypes[Type]
  ): Promise<OBSResponseTypes[Type]> {
    let ret: any;

    const obs = this.obs;

    switch (requestType) {
      case "CreateScene": {
        const data = requestData as OBSRequestTypes["CreateScene"];

        obs.createScene(data.sceneName);

        break;
      }

      case "RemoveScene": {
        const data = requestData as OBSRequestTypes["RemoveScene"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        scene.remove();

        break;
      }

      case "CreateInput": {
        const data = requestData as OBSRequestTypes["CreateInput"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const input = new Input(
          obs,
          data.inputName,
          data.inputKind,
          data.inputSettings
        );

        this.obs.addInput(input);

        const sceneItemId = scene.generateId();

        new SceneItem(sceneItemId, input, scene);

        ret = { sceneItemId } as OBSResponseTypes["CreateInput"];

        break;
      }

      case "RemoveInput": {
        const data = requestData as OBSRequestTypes["RemoveInput"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        input.remove();

        break;
      }

      case "GetInputSettings": {
        const data = requestData as OBSRequestTypes["GetInputSettings"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        ret = {
          inputKind: input.kind,
          inputSettings: input.settings,
        } as OBSResponseTypes["GetInputSettings"];

        break;
      }

      case "SetInputSettings": {
        const data = requestData as OBSRequestTypes["SetInputSettings"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        for (let key in data.inputSettings) {
          input.settings[key] = data.inputSettings[key];
        }

        break;
      }

      case "GetSceneItemTransform": {
        const data = requestData as OBSRequestTypes["GetSceneItemTransform"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);
        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemTransform: item.transform,
        } as OBSResponseTypes["GetSceneItemTransform"];

        break;
      }

      case "SetSceneItemTransform": {
        const data = requestData as OBSRequestTypes["SetSceneItemTransform"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);
        if (!item) throw new Error("Scene item not found");

        item.transform = {
          ...item.transform,
          ...removeUndefinedValues(data.sceneItemTransform),
        };

        break;
      }

      case "CreateSceneItem": {
        const data = requestData as OBSRequestTypes["CreateSceneItem"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const id = scene.generateId();

        new SceneItem(id, source, scene);

        ret = { sceneItemId: id } as OBSResponseTypes["CreateSceneItem"];

        break;
      }

      case "RemoveSceneItem": {
        const data = requestData as OBSRequestTypes["RemoveSceneItem"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);
        if (!item) throw new Error("Item not found");

        item.remove();

        break;
      }

      case "GetSceneItemList": {
        const data = requestData as OBSRequestTypes["GetSceneItemList"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        ret = {
          sceneItems: scene.items.map((item, index) => ({
            sceneItemId: item.id,
            sceneItemIndex: index,
            sourceName: item.source.name,
            sourceType:
              item instanceof Scene
                ? "OBS_SOURCE_TYPE_SCENE"
                : "OBS_SOURCE_TYPE_INPUT",
            inputKind: item.source.kind,
            isGroup: false,
          })),
        } as OBSResponseTypes["GetSceneItemList"];

        break;
      }

      case "GetSceneList": {
        ret = {
          scenes: [...obs.scenes.values()].map((scene, index) => ({
            sceneName: scene.name,
            sceneIndex: index,
          })),
          currentProgramSceneName: "",
          currentPreviewSceneName: "",
        } as OBSResponseTypes["GetSceneList"];

        break;
      }

      case "GetInputList": {
        ret = {
          inputs: [...obs.inputs.values()].map((input, index) => ({
            inputName: input.name,
            inputIndex: index,
            inputKind: input.kind,
            unversionedInputKind: input.kind,
          })),
        } as OBSResponseTypes["GetInputList"];

        break;
      }

      case "GetSourceFilterList": {
        const data = requestData as OBSRequestTypes["GetSourceFilterList"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        ret = {
          filters: source.filters.map((filter) => ({
            filterName: filter.name,
            filterEnabled: filter.enabled,
            filterIndex: filter.index,
            filterKind: filter.kind,
            filterSettings: filter.settings,
          })),
        } as OBSResponseTypes["GetSourceFilterList"];

        break;
      }

      case "CreateSourceFilter": {
        const data = requestData as OBSRequestTypes["CreateSourceFilter"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const filter = new Filter(
          data.filterName,
          data.filterKind,
          data.filterSettings
        );

        source.addFilter(filter);

        break;
      }

      case "RemoveSourceFilter": {
        const data = requestData as OBSRequestTypes["RemoveSourceFilter"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);
        if (!filter) throw new Error("Filter not found");

        source.removeFilter(filter);

        break;
      }

      case "GetSourceFilterDefaultSettings": {
        ret = {
          filterSettings: {},
        } as OBSResponseTypes["GetSourceFilterDefaultSettings"];

        break;
      }

      case "GetSourceFilter": {
        const data = requestData as OBSRequestTypes["GetSourceFilter"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);
        if (!filter) throw new Error("Filter not found");

        ret = {
          filterName: filter.name,
          filterEnabled: filter.enabled,
          filterIndex: filter.index,
          filterKind: filter.kind,
          filterSettings: filter.settings,
        } as OBSResponseTypes["GetSourceFilter"];

        break;
      }

      case "SetSourceFilterIndex": {
        const data = requestData as OBSRequestTypes["SetSourceFilterIndex"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);
        if (!filter) throw new Error("Filter not found");

        source.filters.splice(filter.index, 1);
        source.filters.splice(data.filterIndex, 0, filter);

        break;
      }

      case "SetSourceFilterSettings": {
        const data = requestData as OBSRequestTypes["SetSourceFilterSettings"];

        const source = obs.sources.get(data.sourceName);
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

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        const filter = source.filters.find((f) => f.name === data.filterName);
        if (!filter) throw new Error("Filter not found");

        filter.enabled = data.filterEnabled;

        break;
      }

      case "GetSceneItemEnabled": {
        const data = requestData as OBSRequestTypes["GetSceneItemEnabled"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);
        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemEnabled: item.enabled,
          sceneItemId: data.sceneItemId,
          sceneName: data.sceneName,
        } as OBSRequestTypes["GetSceneItemEnabled"];

        break;
      }

      case "GetSceneItemLocked": {
        const data = requestData as OBSRequestTypes["GetSceneItemLocked"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((i) => i.id === data.sceneItemId);
        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemLocked: item.locked,
        } as OBSResponseTypes["GetSceneItemLocked"];

        break;
      }

      case "SetSceneName": {
        const data = requestData as OBSRequestTypes["SetSceneName"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        scene.name = data.newSceneName;

        break;
      }

      case "GetSourcePrivateSettings": {
        const data = requestData as OBSRequestTypes["GetSourcePrivateSettings"];

        const source = obs.sources.get(data.sourceName);

        if (!source) throw new Error("Source not found");

        ret = {
          sourceSettings: source.privateSettings,
        } as OBSResponseTypes["GetSourcePrivateSettings"];

        break;
      }

      case "SetSourcePrivateSettings": {
        const data = requestData as OBSRequestTypes["SetSourcePrivateSettings"];

        const source = obs.sources.get(data.sourceName);
        if (!source) throw new Error("Source not found");

        source.setPrivateSettings(data.sourceSettings);

        break;
      }

      case "GetCurrentProgramScene": {
        ret = {
          currentProgramSceneName: obs.currentScenes.program,
        } as OBSResponseTypes["GetCurrentProgramScene"];

        break;
      }

      case "SetCurrentProgramScene": {
        const data = requestData as OBSRequestTypes["SetCurrentProgramScene"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        obs.currentScenes.program = data.sceneName;

        break;
      }

      case "GetCurrentPreviewScene": {
        ret = {
          currentPreviewSceneName: obs.currentScenes.preview,
        } as OBSResponseTypes["GetCurrentPreviewScene"];

        break;
      }

      case "SetCurrentPreviewScene": {
        const data = requestData as OBSRequestTypes["SetCurrentPreviewScene"];

        const scene = obs.scenes.get(data.sceneName);

        if (!scene) throw new Error("Scene not found");

        obs.currentScenes.preview = data.sceneName;

        break;
      }

      case "GetInputAudioMonitorType": {
        const data = requestData as OBSRequestTypes["GetInputAudioMonitorType"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        ret = {
          monitorType: input.audioMonitorType,
        } as OBSResponseTypes["GetInputAudioMonitorType"];

        break;
      }

      case "SetInputAudioMonitorType": {
        const data = requestData as OBSRequestTypes["SetInputAudioMonitorType"];

        const input = obs.inputs.get(data.inputName);

        if (!input) throw new Error("Input not found");

        input.audioMonitorType = data.monitorType;

        break;
      }

      case "GetInputAudioSyncOffset": {
        const data = requestData as OBSRequestTypes["GetInputAudioSyncOffset"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        ret = {
          inputAudioSyncOffset: input.audioSyncOffset,
        } as OBSResponseTypes["GetInputAudioSyncOffset"];

        break;
      }

      case "SetInputAudioSyncOffset": {
        const data = requestData as OBSRequestTypes["SetInputAudioSyncOffset"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        input.audioSyncOffset = data.inputAudioSyncOffset;

        break;
      }

      case "GetInputMute": {
        const data = requestData as OBSRequestTypes["GetInputMute"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        ret = {
          inputMuted: input.muted,
        } as OBSResponseTypes["GetInputMute"];

        break;
      }

      case "SetInputMute": {
        const data = requestData as OBSRequestTypes["SetInputMute"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        input.muted = data.inputMuted;

        break;
      }

      case "GetInputVolume": {
        const data = requestData as OBSRequestTypes["GetInputVolume"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        ret = {
          inputVolumeDb: input.volume.db,
          inputVolumeMul: input.volume.mul,
        } as OBSResponseTypes["GetInputVolume"];

        break;
      }

      case "SetInputVolume": {
        const data = requestData as OBSRequestTypes["SetInputVolume"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        if (data.inputVolumeDb !== undefined)
          input.volume.db = data.inputVolumeDb;

        if (data.inputVolumeMul !== undefined)
          input.volume.mul = data.inputVolumeMul;

        break;
      }

      case "ToggleInputMute": {
        const data = requestData as OBSRequestTypes["ToggleInputMute"];

        const input = obs.inputs.get(data.inputName);
        if (!input) throw new Error("Input not found");

        input.muted = !input.muted;

        ret = {
          inputMuted: input.muted,
        } as OBSResponseTypes["ToggleInputMute"];

        break;
      }

      case "GetSceneItemIndex": {
        const data = requestData as OBSRequestTypes["GetSceneItemIndex"];

        const scene = obs.scenes.get(data.sceneName);
        if (!scene) throw new Error("Scene not found");

        const item = scene.items.find((item) => item.id === data.sceneItemId);
        if (!item) throw new Error("Scene item not found");

        ret = {
          sceneItemIndex: scene.items.indexOf(item),
        } as OBSResponseTypes["GetSceneItemIndex"];

        break;
      }

      case "StartStream": {
        obs.streamStatus.outputActive = true;

        break;
      }

      case "StopStream": {
        obs.streamStatus.outputActive = false;

        break;
      }

      case "ToggleStream": {
        obs.streamStatus.outputActive = !obs.streamStatus.outputActive;

        ret = {
          ...obs.streamStatus,
        } as OBSResponseTypes["ToggleStream"];

        break;
      }

      case "GetStreamStatus": {
        ret = {
          ...obs.streamStatus,
        } as OBSResponseTypes["GetStreamStatus"];

        break;
      }
    }

    return ret;
  }
}
