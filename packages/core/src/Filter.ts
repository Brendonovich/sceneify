import { Source } from "./Source";
import { DeepPartial, FilterSettings } from "./types";

export interface FilterArgs<Settings extends FilterSettings> {
  name: string;
  kind: string;
  settings?: DeepPartial<Settings>;
  enabled?: boolean;
}

export type CustomFilterArgs<Settings extends FilterSettings> = Omit<
  FilterArgs<Settings>,
  "kind"
>;

export abstract class Filter<
  Settings extends FilterSettings = FilterSettings,
  TSource extends Source = Source
> {
  constructor(args: FilterArgs<Settings>) {
    this.initialSettings = args.settings || ({} as any);
    this.name = args.name;
    this.kind = args.kind;
    this.enabled = args.enabled ?? true;
  }

  name: string;
  kind: string;
  enabled: boolean;
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
