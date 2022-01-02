import { Source } from "./Source";
import { DeepPartial, Settings } from "./types";

/** @internal */
export interface FilterArgs<TSettings extends Settings> {
  name: string;
  kind: string;
  settings?: DeepPartial<TSettings>;
  enabled?: boolean;
}

/** @internal */
export type CustomFilterArgs<TSettings extends Settings> = Omit<
  FilterArgs<TSettings>,
  "kind"
>;

/** @internal */
export abstract class Filter<
  TSettings extends Settings = Settings,
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
  settings: DeepPartial<TSettings> = {} as any;

  source?: TSource;

  /** @internal */
  _settingsType!: Settings;
  /** @internal */
  initialSettings: DeepPartial<TSettings> = {} as DeepPartial<TSettings>;

  async setSettings(settings: DeepPartial<TSettings>) {
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
