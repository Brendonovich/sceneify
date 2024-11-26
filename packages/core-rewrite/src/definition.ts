import { OBS } from "./obs.ts";
import { SceneItemTransform } from "./sceneItem.ts";

export function defineInputType<
  TSettings extends Record<string, any>,
  TKind extends string
>(kind: TKind) {
  return new InputType<TKind, TSettings>(kind);
}

abstract class SourceType<TKind extends string> {
  constructor(public kind: TKind) {}

  abstract settings(): SourceType<TKind>;
}

type DefineInputArgs<
  TSettings,
  TFilters extends Record<string, FilterType<string, any>>
> = {
  name: string;
  settings?: Partial<TSettings>;
  filters?: { [K in keyof TFilters]: Filter<TFilters[K]> };
};

export class InputType<
  TKind extends string,
  TSettings extends Record<string, any>
> extends SourceType<TKind> {
  settings<TSettings extends Record<string, any>>(): InputType<
    TKind,
    TSettings
  > {
    return this as any;
  }

  defineInput<TFilters extends Record<string, FilterType<any, any>>>(
    args: DefineInputArgs<TSettings, TFilters>
  ): Input<this, TFilters> {
    return new Input(this, args as any);
  }

  async getDefaultSettings(obs: OBS) {
    const res = await obs.ws.call("GetInputDefaultSettings", {
      inputKind: this.kind,
    });

    return res.defaultInputSettings as TSettings;
  }
}

type DefineFilterArgs<TSettings> = {
  name: string;
  enabled?: boolean;
  settings?: Partial<TSettings>;
};

class FilterType<
  TKind extends string = string,
  TSettings extends Record<string, any> = any
> extends SourceType<TKind> {
  settings<TSettings extends Record<string, any>>(): FilterType<
    TKind,
    TSettings
  > {
    return this as any;
  }

  defineFilter(args: DefineFilterArgs<TSettings>): Filter<this> {
    return new Filter(this, args as any);
  }
}

export function defineFilterType<
  TSettings extends Record<string, any>,
  TKind extends string
>(kind: TKind) {
  return new FilterType<TKind, TSettings>(kind);
}

export type InputTypeSettings<TType extends InputType<any, any>> =
  TType extends InputType<any, infer TSettings> ? TSettings : never;

export class Input<
  TType extends InputType<any, any>,
  TFilters extends Record<string, FilterType>
> {
  constructor(
    public type: TType,
    public args: DefineInputArgs<InputTypeSettings<TType>, TFilters>
  ) {}

  filter(key: keyof TFilters) {
    return this.args.filters?.[key];
  }

  async setSettings(
    obs: OBS,
    settings: Partial<InputTypeSettings<TType>>,
    overlay?: boolean
  ) {
    await obs.ws.call("SetInputSettings", {
      inputName: this.args.name,
      inputSettings: settings,
      overlay,
    });
  }

  async getMuted(obs: OBS) {
    return await obs.ws
      .call("GetInputMute", { inputName: this.args.name })
      .then((r) => r.inputMuted);
  }

  async setMuted(obs: OBS, muted: boolean) {
    await obs.ws.call("SetInputMute", {
      inputName: this.args.name,
      inputMuted: muted,
    });
  }

  async toggleMuted(obs: OBS) {
    return await obs.ws
      .call("ToggleInputMute", { inputName: this.args.name })
      .then((r) => r.inputMuted);
  }

  async getVolume(obs: OBS) {
    return await obs.ws
      .call("GetInputVolume", { inputName: this.args.name })
      .then((r) => ({ db: r.inputVolumeDb, mul: r.inputVolumeMul }));
  }

  async setVolume(obs: OBS, data: { db: number } | { mul: number }) {
    await obs.ws.call("SetInputVolume", {
      inputName: this.args.name,
      ...("db" in data
        ? { inputVolumeDb: data.db }
        : { inputVolumeMul: data.mul }),
    });
  }

  async getAudioSyncOffset(obs: OBS) {
    return await obs.ws
      .call("GetInputAudioSyncOffset", { inputName: this.args.name })
      .then((r) => r.inputAudioSyncOffset);
  }

  async setAudioSyncOffset(obs: OBS, offset: number) {
    await obs.ws.call("SetInputAudioSyncOffset", {
      inputName: this.args.name,
      inputAudioSyncOffset: offset,
    });
  }

  // async setAudioMonitorType(obs: OBS, type: MonitoringType) {
  //   await obs.ws.call("SetInputAudioMonitorType", {
  //     inputName: this.name,
  //     monitorType: type,
  //   });
  // }

  async getSettingListItems<K extends keyof InputTypeSettings<TType> & string>(
    obs: OBS,
    setting: K
  ) {
    const res = await obs.ws.call("GetInputPropertiesListPropertyItems", {
      inputName: this.args.name,
      propertyName: setting,
    });

    return res.propertyItems.map((i) => ({
      enabled: i.itemEnabled as boolean,
      name: i.itemName as string,
      value: i.itemValue as InputTypeSettings<TType>[K],
    }));
  }
}

export type InputFilters<T extends Input<any, any>> = T extends Input<
  any,
  infer TFilters
>
  ? TFilters
  : never;

type FilterTypeSettings<TType extends FilterType<any, any>> =
  TType extends FilterType<any, infer TSettings> ? TSettings : never;

class Filter<TType extends FilterType<any, any>> {
  constructor(
    public type: TType,
    public args: DefineFilterArgs<FilterTypeSettings<TType>>
  ) {}
}

export type DefineSceneItemArgs<TInput extends Input<any, any>> = {
  input: TInput;
  index?: number;
  enabled?: boolean;
} & Partial<SceneItemTransform>;

export type SceneItems = Record<string, Input<any, any>>;

type DefineSceneArgs<TItems extends SceneItems> = {
  name: string;
  items?: { [K in keyof TItems]: DefineSceneItemArgs<TItems[K]> };
  filters?: Record<string, unknown>;
};

export type SceneItemsOfScene<T extends Scene> = T extends Scene<infer TItems>
  ? TItems
  : never;

export class Scene<TItems extends SceneItems = SceneItems> {
  constructor(public args: DefineSceneArgs<TItems>) {}
}

export function defineScene<TItems extends SceneItems>(
  args: DefineSceneArgs<TItems>
) {
  return new Scene<TItems>(args);
}
