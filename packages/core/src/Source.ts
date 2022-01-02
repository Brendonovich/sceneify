import { Filter } from "./Filter";
import { OBS } from "./OBS";
import { Scene } from "./Scene";
import { SceneItem, SceneItemTransform } from "./SceneItem";
import { Settings } from "./types";

export type SourceFilters = Record<string, Filter>;
export type SourceRefs = Record<string, Record<string, number>>;

export interface SourceArgs<Filters extends SourceFilters> {
  name: string;
  kind: string;
  filters?: Filters;
}

export abstract class Source<Filters extends SourceFilters = {}> {
  name: string;
  kind: string;
  filters: Filter[] = [];

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

  /** @internal */
  private filtersMap: Filters & Record<string, Filter> = {} as Filters;
  /** @internal */
  obs!: OBS;
  /** @internal */
  linked = false;
  /** @internal */
  itemInstances = new Set<SceneItem>();
  /** @internal */
  _settingsType!: Settings;
  protected refs: SourceRefs = {};

  constructor(args: SourceArgs<Filters>) {
    this.name = args.name;
    this.kind = args.kind;
    this.filtersMap = args.filters ?? ({} as Filters);
  }

  filter<R extends keyof Filters>(ref: R): Filters[R];
  filter(ref: string): Filter | undefined;

  /**
   * Gets a filter from the input by its ref
   */
  filter(ref: string) {
    return this.filtersMap[ref];
  }

  /**
   * Adds a filter to this source, provided that 1. The filter has not already been applied
   * to another source, and 2. The source in OBS does not have a filter with a different type
   * but the same name as the filter being added.
   *
   * @internal
   */
  // TODO: Expose when filters requests are implemented
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
   * Updates the source's filters in OBS so that they match the filters defined in `this.filters`.
   * This is done by removing filters that are present on the source in OBS but not on `this`, and adding filters that are present on `this` but not on the source.
   *
   * This shouldn't be required very often, probably only on source initialization.
   *
   * @internal
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

    if (updateSettings)
      await Promise.all(
        filtersToUpdateSettings.map((filter) =>
          filter.setSettings(filter.settings)
        )
      );
  }

  /** @internal */
  async initialize(obs: OBS) {
    if (this.initalized) return;

    this.obs = obs;

    const exists = await this.fetchExists();
    if (exists) await this.fetchRefs();

    this._exists = exists;
    this._initialized = true;
  }

  /**
   * Creates an instance of the source with the provided data and marks itself as existing and
   * initialized, as if the source was created by code
   *
   * @internal
   */
  linkItem(scene: Scene, id: number, ref: string) {
    this.linked = true;
    this._exists = true;
    this._initialized = true;
    this.obs = scene.obs;

    return this.createSceneItemObject(scene, id, ref);
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
      itemId = await this.createFirstSceneItem(scene);

      this._exists = true;

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

    // As we have created a new scene item, set the corresponding ref.
    this.addRef(scene.name, ref, itemId);

    // Item for sure exists in OBS, so we create an object to interact with it
    const item = this.createSceneItemObject(scene, itemId, ref);

    // If we found an existing item and got its properties, assign them
    if (transform !== null) item.transform = transform;

    return item;
  }

  /**
   * Overridable function for creating {@link SceneItem} instances for a source.
   * Doesn't create any objects in OBS. Instead, creates {@link SceneItem} objects that can
   * override default {@link SceneItem}  behaviours.
   *
   * @returns An instance of {@link SceneItem} or a class that extends it.
   */
  // TODO: Think of a better name for ths function
  createSceneItemObject(
    scene: Scene,
    id: number,
    ref: string
  ): SceneItem<this> {
    return new SceneItem(this, scene, id, ref);
  }

  /**
   * Creates the source and a scene item of it.
   * This is abstract since scenes start with 0 items,
   * but inputs start with 1, and scenes have to create
   * their items before creating scene items of themselves
   */
  protected abstract createFirstSceneItem(scene: Scene): Promise<number>;

  /**
   * Fetches whether the source exists in OBS,
   * throwing an error if a source with the same
   * name but differerent type already exists
   *
   * @internal
   */
  protected abstract fetchExists(): Promise<boolean>;

  protected async setPrivateSettings(settings: Settings) {
    await this.obs.call("SetSourcePrivateSettings", {
      sourceName: this.name,
      sourceSettings: settings,
    });
  }

  protected getRef(scene: string, ref: string): number | undefined {
    return this.refs[scene]?.[ref];
  }

  protected async addRef(scene: string, ref: string, id: number) {
    (this.refs[scene] ||= {})[ref] = id;

    await this.sendRefs().catch((e) =>
      console.warn(`Failed to add ref ${ref} -> ${id}`, e)
    );
  }

  protected async removeRef(scene: string, ref: string) {
    delete this.refs[scene]?.[ref];

    await this.sendRefs().catch((e) =>
      console.warn(`Failed to remove ref ${ref}`, e)
    );
  }

  private async sendRefs() {
    await this.obs.call("SetSourcePrivateSettings", {
      sourceName: this.name,
      sourceSettings: {
        SIMPLE_OBS_REFS: this.refs,
      },
    });
  }

  private async fetchRefs() {
    const { sourceSettings } = await this.obs.call("GetSourcePrivateSettings", {
      sourceName: this.name,
    });

    this.refs = sourceSettings.SIMPLE_OBS_REFS || {};
    console.log(this.name, this.refs);
  }

  /**
   * Gathers this source's itemRefs, calculates the refs value accordingly, and forcefully
   * pushes it to the source in OBS. This method is destructive, and should only be used sparingly.
   *
   * @internal
   */
  pushRefs() {
    let refs: SourceRefs = {};

    this.itemInstances.forEach(
      (item) => ((refs[item.scene.name] ||= {})[item.ref] = item.id)
    );

    this.refs = refs;

    return this.sendRefs();
  }
}
