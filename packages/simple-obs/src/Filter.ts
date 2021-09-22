import { obs, Source } from ".";
import { DeepPartial } from "./types";
import { mergeDeep } from "./utils";

export interface FilterArgs<Settings> {
  name: string;
  settings: DeepPartial<Settings>;
}

type FilterSettings = Record<string, any>;

export abstract class Filter<
  Settings extends FilterSettings = FilterSettings,
  TSource extends Source = Source
> {
  /**
   * @internal
   */
  initialSettings: DeepPartial<Settings>;

  constructor({ name, settings }: FilterArgs<Settings>) {
    this.name = name;
    this.initialSettings = settings;
  }

  abstract type: string;

  name: string;
  source?: TSource;
  settings: DeepPartial<Settings> = {} as any;
  visible = true;

  _settingsType!: Settings;

  setSettings(settings: DeepPartial<Settings>) {
    if (!this.source) {
      console.warn(
        `Attempted to set settings on sourceless filter ${this.name}`
      );
      return;
    }

    mergeDeep(this.settings, settings);

    return obs.setSourceFilterSettings({
      source: this.source.name,
      filter: this.name,
      settings: settings as any,
    });
  }

  setVisible(visible: boolean) {
    if (!this.source) {
      console.warn(
        `Attempted to set visibility on sourceless filter ${this.name}`
      );
      return;
    }

    this.visible = visible;

    return obs.setSourceFilterVisibility({
      source: this.source.name,
      filter: this.name,
      visible,
    });
  }
}
