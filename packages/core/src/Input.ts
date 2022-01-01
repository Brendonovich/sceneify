import { Scene } from "./Scene";
import { DeepPartial } from "./types";
import { SourceSettings, SourceFilters, Source, SourceArgs } from "./Source";
import { MonitoringType } from "./constants";

export type CustomInputArgs<
  Settings extends SourceSettings,
  Filters extends SourceFilters
> = Omit<SourceArgs<Settings, Filters>, "kind">;

export class Input<
  Settings extends SourceSettings = {},
  Filters extends SourceFilters = {}
> extends Source<Settings, Filters> {
  volume = {
    db: 0,
    mul: 0,
  };
  audioMonitorType = MonitoringType.None;
  audioSyncOffset = 0;
  muted = false;

  protected async doInitialize() {
    if (this.obs._sceneNames.has(this.name))
      throw new Error(
        `Failed to initialize input ${this.name}: A scene with this name already exists.`
      );
    try {
      const { inputSettings, inputKind } = await this.obs.call(
        "GetInputSettings",
        {
          inputName: this.name,
        }
      );

      // Exit if source exists but type doesn't match
      if (inputKind !== this.kind) throw ["WRONG_KIND", inputKind];

      // Assign refs from previous runs of code
      if (inputSettings.SIMPLE_OBS_REFS)
        this.refs = inputSettings.SIMPLE_OBS_REFS as any;

      await this.saveRefs();

      this.obs.inputs.set(this.name, this);

      return {
        exists: true,
        settings: inputSettings as DeepPartial<Settings>,
      };

      // await this.initializeFilters();
    } catch (e) {
      if (Array.isArray(e) && e[0] === "WRONG_KIND")
        throw new Error(
          `Failed to initialize input ${this.name}: An input with the same name but of kind ${e[1]} already exists`
        );

      return { exists: false };
    }
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

  protected saveRefs() {
    // This isn't await-ed since the worst thing that can happen with a failed ref is a source is deleted by obs.clean.
    // We don't really care to know when it finishes.
    return this.obs.call("SetInputSettings", {
      inputName: this.name,
      inputSettings: {
        SIMPLE_OBS_REFS: this.refs,
      },
    });
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
