import { Filter } from "./Filter";
import { OBS } from "./OBS";
import { Scene } from "./Scene";
import { SceneItem } from "./SceneItem";
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
  /** @internal */
  protected _exists = false;

  /**
   * Whether `initialize` has been called on this source yet
   */
  get initialized() {
    return this._initialized;
  }
  /** @internal */
  protected _initialized = false;

  /** @internal */
  protected filtersSchema: Filters & Record<string, Filter> = {} as Filters;
  obs!: OBS;
  linked = false;
  itemInstances = new Set<SceneItem>();

  /** @internal */
  refs: SourceRefs = {};

  constructor(args: SourceArgs<Filters>) {
    this.name = args.name;
    this.kind = args.kind;
    this.filtersSchema = args.filters ?? ({} as Filters);
  }

  filter<R extends keyof Filters>(ref: R): Filters[R];
  filter(ref: string): Filter | undefined;

  /**
   * Gets a filter from the input by its ref
   */
  filter(ref: string) {
    return this.filters.find((f) => f.ref === ref);
  }

  /**
   * Adds a filter to this source, provided that 1. The filter has not already been applied
   * to another source, and 2. The source in OBS does not have a filter with a different type
   * but the same name as the filter being added.
   */
  async addFilter(ref: string, filter: Filter) {
    await filter.create(ref, this);

    this.filters.push(filter);

    // TODO: Filter refs
  }

  /**
   * Overridable function for creating {@link SceneItem} instances for a source.
   * Doesn't create any objects in OBS. Instead, creates {@link SceneItem} objects that can
   * override default {@link SceneItem}  behaviours.
   *
   * @returns An instance of {@link SceneItem} or a class that extends it.
   */
  createSceneItemObject(
    scene: Scene,
    id: number,
    ref: string
  ): SceneItem<this> {
    return new SceneItem(this, scene, id, ref);
  }

  /**8
   * Get a source's private settings.
   * This is an UNDOCUMENTED request of obs-websocket,
   * and SHOULD NOT be used unless you know what you're doing.
   */
  async getPrivateSettings(): Promise<Settings> {
    const { sourceSettings } = await this.obs.call("GetSourcePrivateSettings", {
      sourceName: this.name,
    });

    return sourceSettings;
  }

  /**
   * Set a source's private settings.
   * This is an UNDOCUMENTED request of obs-websocket,
   * and SHOULD NOT be used unless you know what you're doing.
   */
  async setPrivateSettings(settings: Settings) {
    await this.obs.call("SetSourcePrivateSettings", {
      sourceName: this.name,
      sourceSettings: settings,
    });
  }

  /** @internal */
  async initialize(obs: OBS) {
    if (this.initialized) return;

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
   * Should only be called by a Scene, so that the item can be added
   * to the scene's item list
   *
   * @returns A SceneItem created by `Source.createSceneItem`
   * @internal
   */
  async createSceneItem<S extends Scene>(
    ref: string,
    scene: S,
    enabled: boolean = true
  ) {
    if (!this.initialized)
      throw new Error(
        `Cannot create item of source ${this.name} as it is not initialized`
      );

    let itemId: number;

    if (this.exists) {
      // First, attempt to connect to existing scene item with provided ref
      const id = this.getRef(scene.name, ref);

      if (id !== undefined) {
        // If a ref exists, attempt to find the corresponding item
        try {
          await this.obs.call("GetSceneItemIndex", {
            sceneItemId: id,
            sceneName: scene.name,
          });

          await this.obs.call("SetSceneItemEnabled", {
            sceneItemId: id,
            sceneName: scene.name,
            sceneItemEnabled: enabled,
          });

          itemId = id;
        } catch {
          // If the item doesn't actually exist, remove the existing ref and create a new instance of the source
          const [{ sceneItemId }] = await Promise.all([
            this.obs.call("CreateSceneItem", {
              sceneName: scene.name,
              sourceName: this.name,
              sceneItemEnabled: enabled,
            }),
            this.removeRef(scene.name, ref),
          ]);

          itemId = sceneItemId;
        }
      } else {
        // If no ref exists, we could try and look for items that match the source,
        // but that would defeat the point of `obs.clean`. Instead, we create a new item
        // of the source, keeping in mind that multiple items of a source can exist at once.
        // Thus, any old items of the source will exist alongisde the newly created item,
        // ready to be removed with `obs.clean`.

        const { sceneItemId } = await this.obs.call("CreateSceneItem", {
          sceneName: scene.name,
          sourceName: this.name,
        });

        itemId = sceneItemId;
      }
    } else {
      itemId = await this.createFirstSceneItem(scene, enabled);

      this._exists = true;
    }

    // As we have created a new scene item, set the corresponding ref.
    await this.addRef(scene.name, ref, itemId);

    // Item for sure exists in OBS, so we create an object to interact with it
    const item = this.createSceneItemObject(scene, itemId, ref);

    this.itemInstances.add(item);

    for (const ref in this.filtersSchema) {
      await this.addFilter(ref, this.filtersSchema[ref]);
    }

    return item;
  }

  /**
   * Creates the source and a scene item of it.
   * This is abstract since scenes start with 0 items,
   * but inputs start with 1, and scenes have to create
   * their items before creating scene items of themselves
   *
   * @internal
   */
  protected abstract createFirstSceneItem(
    scene: Scene,
    enabled: boolean
  ): Promise<number>;

  /**
   * Fetches whether the source exists in OBS,
   * throwing an error if a source with the same
   * name but differerent type already exists
   *
   * @internal
   */
  abstract fetchExists(): Promise<boolean>;

  /** @internal */
  getRef(scene: string, ref: string): number | undefined {
    return this.refs[scene]?.[ref];
  }

  /** @internal */
  async addRef(scene: string, ref: string, id: number) {
    (this.refs[scene] ||= {})[ref] = id;

    await this.sendRefs().catch((e) => {
      throw new Error(
        `Sceneify Internal Error: Failed to remove ref ${ref} -> ${id} ($${e})`
      );
    });
  }

  /** @internal */
  async removeRef(scene: string, ref: string) {
    delete this.refs[scene]?.[ref];

    if (Object.keys(this.refs[scene]).length === 0) {
      delete this.refs[scene];
    }

    await this.sendRefs().catch((e) => {
      throw new Error(
        `Sceneify Internal Error: Failed to remove ref ${ref} (${e})`
      );
    });
  }

  /** @internal */
  private async sendRefs() {
    await this.obs.call("SetSourcePrivateSettings", {
      sourceName: this.name,
      sourceSettings: {
        SCENEIFY_REFS: this.refs,
      },
    });
  }

  /** @internal */
  private async fetchRefs() {
    const privateSettings = await this.getPrivateSettings();

    this.refs = privateSettings.SCENEIFY_REFS || {};
  }

  /**
   * Gathers this source's itemRefs, calculates the refs value accordingly, and forcefully
   * pushes it to the source in OBS. This method is destructive, and should only be used sparingly.
   *
   * @internal
   */
  refreshRefs() {
    let refs: SourceRefs = {};

    this.itemInstances.forEach(
      (item) => ((refs[item.scene.name] ||= {})[item.ref] = item.id)
    );

    this.refs = refs;

    return this.sendRefs();
  }

  /** @internal */
  abstract removeItemInstance(item: SceneItem<this>): void;
}
