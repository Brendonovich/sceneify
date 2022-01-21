import { Scene } from "./Scene";
import { Settings } from "./types";
import { SourceFilters, Source, SourceArgs } from "./Source";
import { MonitoringType } from "./constants";

export type CustomInputArgs<
  TSettings extends Settings,
  Filters extends SourceFilters
> = Omit<InputArgs<TSettings, Filters>, "kind">;

export interface InputArgs<
  TSettings extends Settings = {},
  Filters extends SourceFilters = {}
> extends SourceArgs<Filters> {
  settings?: Partial<TSettings>;
}

export class Input<
  TSettings extends Settings = {},
  Filters extends SourceFilters = {}
> extends Source<Filters> {
  volume = {
    db: 0,
    mul: 0,
  };
  audioMonitorType = MonitoringType.None;
  audioSyncOffset = 0;
  muted = false;

  settings: Partial<Settings>;

  constructor(args: InputArgs<TSettings, Filters>) {
    super(args);

    this.settings = args.settings ?? {};
  }

  async setSettings(settings: Partial<TSettings>) {
    await this.obs.call("SetInputSettings", {
      inputName: this.name,
      inputSettings: settings,
    });

    this.settings = {
      ...this.settings,
      settings,
    };
  }

  protected async fetchExists() {
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

  protected async createFirstSceneItem(scene: Scene) {
    const { sceneItemId } = await this.obs.call("CreateInput", {
      inputName: this.name,
      inputKind: this.kind,
      sceneName: scene.name,
      inputSettings: this.settings,
    });

    this.obs.inputs.set(this.name, this);

    return sceneItemId;
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
}
