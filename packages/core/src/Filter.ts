import { Source } from "./Source";
import { DeepPartial, FilterSettings } from "./types";

export abstract class Filter<
  Settings extends FilterSettings = FilterSettings,
  TSource extends Source = Source
> {
  constructor(
    public name: string,
    public kind: string,
    initialSettings: DeepPartial<Settings> = {} as DeepPartial<Settings>,
    public enabled = true
  ) {
    this.initialSettings = initialSettings;
  }

  settings: DeepPartial<Settings> = {} as any;

  source?: TSource;

  /** @internal */
  _settingsType!: Settings;
  /** @internal */
  initialSettings: DeepPartial<Settings> = {} as DeepPartial<Settings>;

  async setSettings(settings: DeepPartial<Settings>) {
    this.checkSource();

    await this.source!.obs.call("SetSourceFilterSettings", {
      sourceName: this.source!.name,
      filterName: this.name,
      filterSettings: settings as any,
    });

    for (let setting in settings) {
      this.settings[setting] = settings[setting];
    }
  }

  async setEnabled(enabled: boolean) {
    this.checkSource();

    await this.source!.obs.call("SetSourceFilterEnabled", {
      sourceName: this.source!.name,
      filterEnabled: enabled,
      filterName: this.name,
    });

    this.enabled = enabled;
  }

  get index(): number {
    this.checkSource();

    return this.source!.filters.indexOf(this);
  }

  private checkSource() {
    if (!this.source)
      throw new Error(`Filter ${this.name} does not have source.`);
  }
}
