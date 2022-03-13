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

  source!: TSource;
  ref!: string;

  private initialSettings: DeepPartial<TSettings> = {} as any;

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

  async remove() {
    this.checkSource();

    await this.source!.obs.call("RemoveSourceFilter", {
      sourceName: this.source!.name,
      filterName: this.name,
    });

    this.source!.filters.splice(this.source!.filters.indexOf(this), 1);
    this.source = undefined as any;
  }

  /** @internal */
  async create(ref: string, source: TSource) {
    if (this.source)
      if (this.source === source && this.ref === ref)
        // Return early since create() has already been called
        return;
      else
        throw new Error(
          `Failed to add filter ${this.name} to source ${this.name}: Filter has already been added to source ${this.source.name} under ref ${this.ref}`
        );

    this.ref = ref;
    this.source = source;

    const { exists } = await source.obs
      .call("GetSourceFilter", {
        sourceName: this.source.name,
        filterName: this.name,
      })
      .then((f) => {
        if (this.kind !== f.filterKind)
          throw {
            error: `Failed to add filter ${this.name} to source ${this.source.name}: Filter exists in OBS but has different kind, expected ${this.kind} but found ${f.filterKind}`,
          };

        return { exists: true };
      })
      .catch((data: { error: string; exists: boolean }) => {
        if (data.error) throw new Error(data.error);

        return { exists: data.exists ?? false };
      });

    if (!exists)
      await source.obs.call("CreateSourceFilter", {
        filterName: this.name,
        filterKind: this.kind,
        filterSettings: this.initialSettings,
        sourceName: this.source.name,
      });
    else await this.setSettings(this.initialSettings);

    await this.setEnabled(this.enabled);
  }

  /** @internal */
  checkSource() {
    if (!this.source)
      throw new Error(`Filter ${this.name} does not have a source.`);
  }
}
