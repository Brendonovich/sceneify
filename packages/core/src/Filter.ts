import { Source } from "./Source";
import { DeepPartial, Settings } from "./types";

export interface FilterArgs<TSettings extends Settings> {
  name: string;
  kind: string;
  settings?: DeepPartial<TSettings>;
  enabled?: boolean;
}

export type CustomFilterArgs<TSettings extends Settings> = Omit<
  FilterArgs<TSettings>,
  "kind"
>;

export class Filter<
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

  initialSettings: DeepPartial<TSettings> = {} as DeepPartial<TSettings>;
  ref!: string;

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

  /** @internal */
  checkSource() {
    if (!this.source)
      throw new Error(`Filter ${this.name} does not have a source.`);
  }

  async remove() {
    this.checkSource();

    await this.source!.obs.call("RemoveSourceFilter", {
      sourceName: this.source!.name,
      filterName: this.name,
    });

    this.source!.filters.splice(this.source!.filters.indexOf(this), 1);
    this.source = undefined;
  }
}
