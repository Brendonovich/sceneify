import { Scene } from "./Scene";
import { OBS } from "./OBS";
import { Filter } from "./Filter";
import { SceneItem, SceneItemTransform } from "./SceneItem";
import { DeepPartial } from "./types";
import { MonitoringType } from "./constants";

export type SourceRefs = Record<string, Record<string, number>>;

export type SourceFilters = Record<string, Filter>;
export type SourceSettings = Record<string, any>;

export interface SourceArgs<
  Settings extends SourceSettings,
  Filters extends SourceFilters
> {
  name: string;
  kind: string;
  settings?: DeepPartial<Settings>;
  filters?: Filters;
}

export type CustomSourceArgs<
  Settings extends SourceSettings,
  Filters extends SourceFilters
> = Omit<SourceArgs<Settings, Filters>, "kind">;

export class Source<
  Settings extends SourceSettings = SourceSettings,
  Filters extends SourceFilters = SourceFilters
> {
  constructor(args: SourceArgs<Settings, Filters>) {
    this.name = args.name;
    this.kind = args.kind;
    this.settings = args.settings ?? ({} as DeepPartial<Settings>);
    this.filtersMap = args.filters ?? ({} as Filters);
  }

  /**
   * PROPERTIES
   * Data available about the source that is native to OBS
   */

  /** */
  name: string;
  kind: string;
  filters: Filter[] = [];
  settings: DeepPartial<Settings>;
  volume = {
    db: 0,
    mul: 0,
  };
  audioMonitorType = MonitoringType.None;
  audioSyncOffset = 0;
  muted = false;

  /**
   * METADATA
   * Data used by simple-obs internally
   */
  /** @internal */
  obs!: OBS;
  /** @internal */
  linked = false;
  /** @internal */
  itemInstances = new Set<SceneItem>();
  /** @internal */
  private filtersMap: Filters & Record<string, Filter> = {} as Filters;
  /** @internal */
  _settingsType!: Settings;

  /**
   * Whether this source has at least one scene item in OBS
   */
  get exists() {
    return this._exists;
  }
  protected _exists = false;

  /**
   * Whether `initialize` has been called on this source yet
   */
  get initalized() {
    return this._initialized;
  }
  protected _initialized = false;

  async setSettings(settings: DeepPartial<Settings>) {
    await this.obs.call("SetInputSettings", {
      inputName: this.name,
      inputSettings: settings,
    });

    for (let setting in settings) {
      this.settings[setting] = settings[setting];
    }
  }

  filter<R extends keyof Filters>(ref: R): Filters[R];
  filter(ref: string): Filter | undefined;

  /**
   * Gets a filter from the source by its ref
   */
  filter(ref: string) {
    return this.filtersMap[ref];
  }

  /**
   * Fetches the source's mute, volume, audio sync offset and audio monitor type from OBS
   * and assigns them to the source
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

  /**
   * Adds a filter to this source, provided that 1. The filter has not already been applied
   * to another source, and 2. The source in OBS does not have a filter with a different type
   * but the same name as the filter being added.
   */
  async addFilter(ref: string, filter: Filter, index?: number) {
    if (filter.source) {
      throw new Error(
        `Filter ${this.name} has already been applied to source ${filter.source.name}`
      );
    }

    const exists = await this.obs
      .call("GetSourceFilter", {
        sourceName: this.name,
        filterName: filter.name,
      })
      .then((f) => {
        if (filter.kind !== f.filterKind)
          throw new Error(
            `Filter ${this.name} already exists but has different kind. Expected ${filter.kind}, found ${f.filterKind}`
          );
        return true;
      })
      .catch(() => false);

    filter.source = this;

    if (!exists)
      await this.obs.call("CreateSourceFilter", {
        filterName: filter.name,
        filterKind: filter.kind,
        filterIndex: index,
        filterSettings: filter.initialSettings,
        sourceName: this.name,
      });

    Object.assign(this.filtersMap, { [ref]: filter });

    if (index !== undefined)
      this.filters.splice(index ?? this.filters.length, 0, filter);
  }

  /**
   * Overridable function for creating `SceneItem` instances for a source.
   * Doesn't create any objects in OBS. Instead, creates `SceneItem` instances that can
   * override default `SceneItem` behaviours.
   *
   * @returns An instance of `SceneItem` or a class that derives it.
   */
  createItemInstance(scene: Scene, id: number, ref: string): SceneItem<this> {
    return new SceneItem(this, scene, id, ref);
  }

  /**
   * Updates the source's filters in OBS so that they match the filters defined in `this.filters`.
   * This is done by removing filters that are present on the source in OBS but not on `this`, and adding filters that are present on `this` but not on the source.
   *
   * This shouldn't be required very often, probably only on source initialization.
   */
  async cleanFilters(updateSettings = true) {
    if (!this.exists) return;

    const { filters } = await this.obs.call("GetSourceFilterList", {
      sourceName: this.name,
    });

    const filtersToRemove = filters.filter((obsFilter) =>
      this.filters.every(
        (filter) =>
          filter.name !== obsFilter.filterName ||
          (filter.name === obsFilter.filterName &&
            filter.kind !== obsFilter.filterKind)
      )
    );
    const filtersToAdd = this.filters.filter((filter) =>
      filters.every(
        (obsFilter) =>
          filter.name !== obsFilter.filterName ||
          (filter.name === obsFilter.filterName &&
            filter.kind !== obsFilter.filterKind)
      )
    );
    const filtersToUpdateSettings = this.filters.filter((filter) =>
      filters.some(
        (sourceFilter) =>
          filter.name === sourceFilter.filterName &&
          filter.kind === sourceFilter.filterKind
      )
    );

    await Promise.all(
      filtersToRemove.map((filter) =>
        this.obs.call("RemoveSourceFilter", {
          sourceName: this.name,
          filterName: filter.filterName,
        })
      )
    );

    await Promise.all(
      filtersToAdd.map((filter) =>
        this.obs.call("CreateSourceFilter", {
          sourceName: this.name,
          filterName: filter.name,
          filterKind: filter.kind,
          filterSettings: filter.initialSettings,
          filterIndex: filter.index,
        })
      )
    );

    await Promise.all(
      filtersToUpdateSettings.map((filter) =>
        filter.setSettings(filter.settings)
      )
    );
  }

  /**
   * Fetches initial data for the source.
   *
   * @returns If the source has been initialized (will always be `true`).
   * Returns true immediately if already initialized, else will return a promise that resolves
   * when initialization is finished.
   *
   * Avoiding returning a promise where possible allows for tighter batching of obs requests that
   * happen in the same tick.
   *
   * @internal
   *
   */
  async initialize(obs: OBS) {
    if (this.initalized) return;

    this.obs = obs;

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

      this.obs.sources.set(this.name, this);

      this._exists = true;

      // await this.initializeFilters();
    } catch (e) {
      if (Array.isArray(e) && e[0] === "WRONG_KIND")
        throw new Error(
          `Source with name ${this.name} has different type in OBS than expected. Found: ${e[1]}, Expected: ${this.kind}`
        );

      this._exists = false;
    }

    this._initialized = true;
  }

  /**
   * Creates a scene item of this source in the provided scene.
   * Requires that this source has been initialized.
   * If the source already exists, a new scene item will be created.
   * If not, the source will be created and added to the scene.
   *
   * @returns A SceneItem created by `Source.createSceneItem`
   * @internal
   */
  async createSceneItem(ref: string, scene: Scene): Promise<SceneItem<this>> {
    if (!this.initalized)
      throw new Error(
        `Cannot create item of source ${this.name} as it is not initialized`
      );

    let itemId: number;
    let transform: SceneItemTransform | null = null;

    if (this.exists) {
      // First, attempt to connect to existing scene item with provided ref
      const id = this.getRef(scene.name, ref);

      // If a ref exists, get the properties of the referenced item
      if (id !== undefined) {
        try {
          const res = await this.obs.call("GetSceneItemTransform", {
            sceneItemId: id,
            sceneName: scene.name,
          });

          transform = res.sceneItemTransform as SceneItemTransform;

          itemId = id;
        } catch {
          // If the item doesn't actually exist, remove the existing ref and create a new instance of the source
          this.removeRef(scene.name, ref);

          const { sceneItemId } = await this.obs.call("CreateSceneItem", {
            sceneName: scene.name,
            sourceName: this.name,
          });

          itemId = sceneItemId;
        }
      } else {
        // If no ref exists, we could try and look for items that match the source,
        // but that would defeat the point of `obs.clean`. Instead, we create a new item
        // of the source, keeping in mind that multiple items of a source can exist at once.
        // Thus, any old items of the source will exist alongisde the newly created item,
        // ready to be removed with `obs.clean`.

        // Also, not checking if a matching item already exists saves on OBS requests :)

        const { sceneItemId } = await this.obs.call("CreateSceneItem", {
          sceneName: scene.name,
          sourceName: this.name,
        });

        itemId = sceneItemId;
      }
    } else {
      const { sceneItemId } = await this.obs.call("CreateInput", {
        inputName: this.name,
        inputKind: this.kind,
        sceneName: scene.name,
        inputSettings: this.settings,
      });

      this.obs.sources.set(this.name, this);

      this._exists = true;

      // await this.initializeFilters();

      itemId = sceneItemId;
    }

    // As we have created a new scene item, set the corresponding ref.
    this.addRef(scene.name, ref, itemId);

    // Item for sure exists in OBS, so we create an instance to interact with it
    const item = this.createItemInstance(scene, itemId, ref);

    // If we found an existing item and got its properties, assign them
    if (transform !== null) item.transform = transform;

    return item;
  }

  /**
   * Uses the source's filterSchema to populate the filters property,
   * creating/linking with filters in OBS in the process.
   */
  private async initializeFilters() {
    // Create a FilterInstance for each schema item. This allows for a filter schema to be
    // used multiple times, but exist in OBS as separate objects.
    for (let ref in this.filters) {
      let filter = this.filters[ref];

      filter.source = this;
      // Necessary since this is usually done in this.addFilter(), and this.refreshFilters() operates on filter.settings
      // Could probably just do addFilter in a loop instead of all this
      filter.settings = filter.initialSettings;
    }

    // We have the FilterInstances created, so we can just refresh as normal to create them in OBS
    await this.cleanFilters();
  }

  /**
   * Creates an instance of the source with the provided data and marks itself as existing and
   * initialized, as if the source was created by code.
   *
   * TODO: Matching settings and filters?
   *
   * @internal
   */
  linkItem(scene: Scene, id: number, ref: string) {
    this.linked = true;
    this._exists = true;
    this._initialized = true;

    return this.createItemInstance(scene, id, ref);
  }

  /**
   * REFS MANAGEMENT
   *
   * Methods and state for managing refs: Data stored in OBS that
   * links scene item references in code to scene item IDs in OBS,
   * so that scene items created in code can be recovered after code restarts,
   * removing the need for all scene items to be removed and recreated to guarantee
   * consistency between code and OBS.
   */

  /**
   * Source's refs.
   * Populated from OBS once on source creation but controlled by the source from then on.
   */
  private refs: SourceRefs = {};

  /**
   * Sends this source's refs to OBS to be saved onto the source
   *
   * @throws If saving the refs fails
   */
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

  protected getRef(scene: string, ref: string): number | undefined {
    return this.refs[scene]?.[ref];
  }

  protected addRef(scene: string, ref: string, id: number) {
    (this.refs[scene] ||= {})[ref] = id;

    this.saveRefs().catch((e) =>
      console.warn(`Failed to add ref ${ref} -> ${id}`, e)
    );
  }

  protected removeRef(scene: string, ref: string) {
    if (!this.refs[scene]) return;

    delete this.refs[scene][ref];

    this.saveRefs().catch((e) =>
      console.warn(`Failed to remove ref ${ref}`, e)
    );
  }

  /**
   * Gathers this source's itemRefs, calculates the refs value accordingly, and forcefully
   * pushes it to the source in OBS. This method is destructive, and should only be used sparingly.
   *
   * @internal
   */
  pushRefs() {
    let refs: SourceRefs = {};

    this.itemInstances.forEach((item) => {
      (refs[item.scene.name] ||= {})[item.ref] = item.id;
    });

    this.refs = refs;

    return this.saveRefs();
  }
}
