import { Source } from "./Source";
import { obs } from "./obs";
import { DeepPartial } from "./types";

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

  async setSettings(settings: DeepPartial<Settings>) {
    if (!this.source) {
      console.warn(
        `Attempted to set settings on sourceless filter ${this.name}`
      );
      return;
    }

    await obs.setSourceFilterSettings({
      source: this.source.name,
      filter: this.name,
      settings: settings as any,
    });

    for (let setting in settings) {
      this.settings[setting] = settings[setting];
    }
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
