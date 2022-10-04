import { Scene } from "./Scene";
import { DeepPartial, Settings } from "./types";
import { SourceFilters, Source, SourceArgs } from "./Source";
import { MonitoringType } from "./constants";
import { SceneItem } from "./SceneItem";
import { OBS } from "./OBS";

export type CustomInputArgs<
  TSettings extends Settings,
  Filters extends SourceFilters
> = Omit<InputArgs<TSettings, Filters>, "kind">;

export interface InputArgs<
  TSettings extends Settings = {},
  Filters extends SourceFilters = {}
> extends SourceArgs<Filters> {
  settings?: DeepPartial<TSettings>;
  volume?: {
    db?: number;
    mul?: number;
  };
  audioMonitorType?: MonitoringType;
  audioSyncOffset?: number;
  muted?: boolean;
}

export type PropertyLists = Record<string, string | number>;

export type PropertyList<T> = {
  enabled: boolean;
  name: string;
  value: T;
}[];

const inputDefaultSettings = new Map<string, Settings>();

export class Input<
  TSettings extends Settings = {},
  Filters extends SourceFilters = {},
  Properties extends PropertyLists = {}
> extends Source<Filters> {
  volume = {
    db: 0,
    mul: 0,
  };
  audioMonitorType = MonitoringType.None;
  audioSyncOffset = 0;
  muted = false;

  /**
   * Set transitively in initialize if source exists
   * Set manually in createFirstSceneItem if source doesn't exist
   */
  settings: DeepPartial<TSettings> = {} as any;

  /** @internal */
  creationArgs: InputArgs<TSettings, Filters>;

  constructor(args: InputArgs<TSettings, Filters>) {
    super(args);

    this.creationArgs = args;
  }

  async setSettings(settings: DeepPartial<TSettings>, overlay = true) {
    await this.obs.call("SetInputSettings", {
      inputName: this.name,
      inputSettings: settings,
      overlay,
    });

    this.settings = {
      ...this.settings,
      settings,
    };
  }

  async getDefaultSettings() {
    const cached = inputDefaultSettings.get(this.kind);
    if (cached)
      return {
        ...cached,
      } as TSettings;

    const { defaultInputSettings } = await this.obs.call(
      "GetInputDefaultSettings",
      {
        inputKind: this.kind,
      }
    );

    inputDefaultSettings.set(this.kind, defaultInputSettings);

    return defaultInputSettings as TSettings;
  }

  async getPropertyListItems<K extends keyof Properties>(
    property: K
  ): Promise<PropertyList<Properties[K]>> {
    const resp = await this.obs.call("GetInputPropertiesListPropertyItems", {
      inputName: this.name,
      propertyName: property as string,
    });

    return resp.propertyItems.map((i) => ({
      enabled: i.itemEnabled,
      name: i.itemName,
      value: i.itemValue as Properties[K],
    }));
  }

  async fetchExists() {
    try {
      await this.obs.call("GetSourcePrivateSettings", {
        sourceName: this.name,
      });
    } catch {
      return false;
    }

    // Does exist, check if it's an input
    const input = await this.obs
      .call("GetInputSettings", {
        inputName: this.name,
      })
      .then((input) => input)
      .catch(() => undefined);

    if (!input)
      throw new Error(
        `Failed to initiailze input ${this.name}: Scene with this name already exists.`
      );

    return true;
  }

  protected async createFirstSceneItem(scene: Scene, enabled?: boolean) {
    const { settings, audioMonitorType, audioSyncOffset, muted, volume } =
      this.creationArgs;

    const { sceneItemId } = await this.obs.call("CreateInput", {
      inputName: this.name,
      inputKind: this.kind,
      sceneName: scene.name,
      inputSettings: settings,
      sceneItemEnabled: enabled,
    });

    this.obs.inputs.set(this.name, this);

    await this.setPrivateSettings({
      SCENEIFY_LINKED: false,
    });

    const defaultSettings = await this.getDefaultSettings();

    this.settings = {
      ...defaultSettings,
      ...settings,
    } as DeepPartial<TSettings>;

    let promises: Promise<any>[] = [];

    // TODO: batch

    if (audioMonitorType)
      promises.push(this.setAudioMonitorType(audioMonitorType));
    if (audioSyncOffset)
      promises.push(this.setAudioSyncOffset(audioSyncOffset));
    if (muted) promises.push(this.setMuted(muted));
    if (volume) promises.push(this.setVolume(volume));

    Promise.all(promises);

    return sceneItemId;
  }

  override async initialize(obs: OBS) {
    await super.initialize(obs);

    if (this.exists) {
      this.obs.inputs.set(this.name, this);
      await this.setSettings(this.creationArgs.settings ?? ({} as any), false);
    }
  }

  /**
   * Fetches the input's mute, volume, audio sync offset and
   * audio monitor type from OBS and assigns them to the input
   */
  async fetchProperties() {
    const args = { inputName: this.name };
    const [
      { inputMuted },
      { inputVolumeDb, inputVolumeMul },
      { inputAudioSyncOffset },
      { monitorType },
    ] = await Promise.all([
      this.obs.call("GetInputMute", args),
      this.obs.call("GetInputVolume", args),
      this.obs.call("GetInputAudioSyncOffset", args),
      this.obs.call("GetInputAudioMonitorType", args),
    ]);

    this.muted = inputMuted;
    this.volume = {
      db: inputVolumeDb,
      mul: inputVolumeMul,
    };
    this.audioSyncOffset = inputAudioSyncOffset;
    this.audioMonitorType = monitorType as MonitoringType;
  }

  async setMuted(muted: boolean) {
    await this.obs.call("SetInputMute", {
      inputName: this.name,
      inputMuted: muted,
    });

    this.muted = muted;
  }

  async toggleMuted() {
    const { inputMuted } = await this.obs.call("ToggleInputMute", {
      inputName: this.name,
    });

    this.muted = inputMuted;

    return inputMuted;
  }

  async setVolume(data: { db?: number; mul?: number }) {
    await this.obs.call("SetInputVolume", {
      inputName: this.name,
      inputVolumeDb: (data as any).db,
      inputVolumeMul: (data as any).mul,
    });

    const resp = await this.obs.call("GetInputVolume", {
      inputName: this.name,
    });

    this.volume = {
      db: resp.inputVolumeDb,
      mul: resp.inputVolumeMul,
    };
  }

  async setAudioSyncOffset(offset: number) {
    await this.obs.call("SetInputAudioSyncOffset", {
      inputName: this.name,
      inputAudioSyncOffset: offset,
    });

    this.audioSyncOffset = offset;
  }

  async setAudioMonitorType(type: MonitoringType) {
    await this.obs.call("SetInputAudioMonitorType", {
      inputName: this.name,
      monitorType: type,
    });

    this.audioMonitorType = type;
  }

  async remove() {
    await this.obs.call("RemoveInput", {
      inputName: this.name,
    });

    this._exists = false;

    this.obs.inputs.delete(this.name);
    this.itemInstances.forEach((i) => {
      i.scene.items.splice(i.scene.items.indexOf(i), 1);
    });
  }

  async setName(name: string) {
    if (this.obs.scenes.has(name))
      throw new Error(
        `Failed to set name of scene ${this.name}: Scene with name '${name}' already exists`
      );

    if (this.obs.inputs.has(name))
      throw new Error(
        `Failed to set name of scene ${this.name}: Input with name '${name}' already exists`
      );

    await this.obs.call("SetInputName", {
      inputName: this.name,
      newInputName: name,
    });

    this.obs.inputs.delete(this.name);
    this.name = name;
    this.obs.inputs.set(this.name, this);
  }

  /** @internal */
  removeItemInstance(item: SceneItem<this>) {
    this.itemInstances.delete(item);

    if (this.itemInstances.size === 0) this._exists = false;
  }
}
