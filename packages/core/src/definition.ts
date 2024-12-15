import { OBSMonitoringType, OBSVolumeInput } from "./obs-types.js";
import { OBS } from "./obs.js";
import { SceneItemTransform } from "./sceneItem.js";

export function defineInputType<
  TSettings extends Record<string, any>,
  TKind extends string
>(kind: TKind) {
  return new InputType<TKind, TSettings>(kind);
}

abstract class SourceType<TKind extends string> {
  constructor(public id: TKind) {}

  abstract settings(): SourceType<TKind>;
}

export type DefineInputArgs<
  TSettings,
  TFilters extends Record<string, FilterType<string, any>>
> = {
  name: string;
  settings?: Partial<TSettings>;
  filters?: { [K in keyof TFilters]: Filter<TFilters[K]> };
};

export type InputTypeSettings<TType extends InputType<any, any>> =
  TType extends InputType<any, infer TSettings> ? TSettings : never;

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
      inputKind: this.id,
    });

    return res.defaultInputSettings as TSettings;
  }
}

type DefineFilterArgs<TSettings> = {
  name: string;
  enabled?: boolean;
  index?: number;
  settings?: Partial<TSettings>;
};

export type FilterTypeSettings<TType extends FilterType<any, any>> =
  TType extends FilterType<any, infer TSettings> ? TSettings : never;

export class FilterType<
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

  async getDefaultSettings(obs: OBS) {
    return await obs.ws
      .call("GetSourceFilterDefaultSettings", { filterKind: this.id })
      .then((r) => r.defaultFilterSettings as TSettings);
  }
}

export function defineFilterType<
  TSettings extends Record<string, any>,
  TKind extends string
>(kind: TKind) {
  return new FilterType<TKind, TSettings>(kind);
}

export type InputSettings<TInput extends Input<any, any>> =
  TInput extends Input<infer TType, any> ? InputTypeSettings<TType> : never;

export class Input<
  TType extends InputType<any, any>,
  TFilters extends Record<string, FilterType>
> {
  constructor(
    public type: TType,
    public args: DefineInputArgs<InputTypeSettings<TType>, TFilters>
  ) {}

  get name() {
    return this.args.name;
  }

  filter(key: keyof TFilters) {
    return this.args.filters?.[key];
  }

  async getSettings(obs: OBS): Promise<InputTypeSettings<TType>> {
    const settings = await obs.ws
      .call("GetInputSettings", { inputName: this.args.name })
      .then((d) => d.inputSettings as any);

    const defaultSettings = await this.type.getDefaultSettings(obs);

    return { ...defaultSettings, ...settings };
  }

  async setSettings(
    obs: OBS,
    settings: Partial<InputTypeSettings<TType>>,
    overlay?: boolean
  ) {
    await obs.ws.call("SetInputSettings", {
      inputName: this.args.name,
      inputSettings: settings as any,
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

  async setVolume(obs: OBS, data: OBSVolumeInput) {
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

  async setAudioMonitorType(obs: OBS, type: OBSMonitoringType) {
    await obs.ws.call("SetInputAudioMonitorType", {
      inputName: this.args.name,
      monitorType: type,
    });
  }

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

  async getFilters(obs: OBS) {
    const { filters } = await obs.ws.call("GetSourceFilterList", {
      sourceName: this.args.name,
    });

    return filters.map((f) => ({
      enabled: f.filterEnabled as boolean,
      index: f.filterIndex as number,
      kind: f.filterKind as string,
      name: f.filterName as string,
      settings: f.filterSettings as any,
    }));
  }
}

export type InputFilters<T extends Input<any, any>> = T extends Input<
  any,
  infer TFilters
>
  ? TFilters
  : never;

export type FilterSettings<TInput extends Filter<any>> = TInput extends Filter<
  infer TType
>
  ? FilterTypeSettings<TType>
  : never;

export class Filter<TType extends FilterType<any, any>> {
  constructor(
    public kind: TType,
    public args: DefineFilterArgs<FilterTypeSettings<TType>>
  ) {}

  get name() {
    return this.args.name;
  }

  async setSettings(
    obs: OBS,
    source: string | { name: string },
    filterSettings: Partial<FilterTypeSettings<TType>>,
    overlay = true
  ) {
    await obs.ws.call("SetSourceFilterSettings", {
      sourceName: typeof source === "string" ? source : source.name,
      filterName: this.args.name,
      filterSettings: filterSettings as any,
      overlay,
    });
  }

  async setIndex(
    obs: OBS,
    source: string | { name: string },
    filterIndex: number
  ) {
    await obs.ws.call("SetSourceFilterIndex", {
      sourceName: typeof source === "string" ? source : source.name,
      filterName: this.args.name,
      filterIndex,
    });
  }

  async setEnabled(
    obs: OBS,
    source: string | { name: string },
    filterEnabled: boolean
  ) {
    await obs.ws.call("SetSourceFilterEnabled", {
      sourceName: typeof source === "string" ? source : source.name,
      filterName: this.args.name,
      filterEnabled,
    });
  }
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

export type SIOfScene<T extends Scene> = T extends Scene<infer TItems>
  ? TItems
  : never;

export class Scene<TItems extends SceneItems = SceneItems> {
  constructor(public args: DefineSceneArgs<TItems>) {}

  get name() {
    return this.args.name;
  }

  async getItems(obs: OBS) {
    return await obs.ws
      .call("GetSceneItemList", { sceneName: this.args.name })
      .then(
        (res) =>
          res.sceneItems as Array<{
            sceneItemId: number;
            sceneItemIndex: number;
            sourceName: string;
            inputKind: string;
          }>
      );
  }
}

export function defineScene<TItems extends SceneItems>(
  args: DefineSceneArgs<TItems>
) {
  return new Scene<TItems>(args);
}
