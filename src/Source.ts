import { FilterSchema, obs, Scene, SceneItem } from ".";
import { DeepPartial } from "./types";
import { mergeDeep } from "./utils";

export type BaseSettings = {
  refs: Record<string, number>;
};

export type SceneName = string;
export type ItemRef = string;
export type ItemID = number;

export abstract class Source<
  Settings extends Record<string, any> = object,
  Filters extends Record<string, FilterSchema> = Record<string, FilterSchema> 
> {
  abstract type: string;

  name: string;
  settings: DeepPartial<Settings>;

  private filtersSchema: Filters;

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

  constructor({
    name,
    settings: initialSettings,
    filters: filtersSchema,
  }: {
    name: string;
    settings?: DeepPartial<Settings>;
    filters?: Filters;
  }) {
    this.name = name;
    this.settings = initialSettings ?? ({} as DeepPartial<Settings>);
    this.filtersSchema = filtersSchema ?? ({} as Filters);
  }

  /**
   * Sets this source's settings, both on this instance and the OBS source.
   *
   * @returns OBS Websocket response for `SetSourceSettings` request
   */
  setSettings(settings: DeepPartial<Settings>) {
    mergeDeep(this.settings, settings);

    return obs.setSourceSettings({
      name: this.name,
      type: this.type,
      settings,
    });
  }

  /**
   * Overridable function for creating `SceneItem` instances for a source.
   * Doesn't create any objects in OBS. Instead, creates `SceneItem` instances that can
   * override default `SceneItem` behaviours.
   *
   * @returns An instance of `SceneItem` or a class that derives it.
   */
  createItemInstance(scene: Scene, id: number): SceneItem<this> {
    return SceneItem.load(this, scene, id);
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
  initialize(): true | Promise<true> {
    if (this.initalized) return true;

    return obs
      .getSourceSettings({
        name: this.name,
      })
      .then(({ sourceSettings, sourceType }) => {
        // Exit if source exists but type doesn't match
        if (sourceType !== this.type) throw ["WRONG_TYPES", sourceType];

        // Assign refs from previous runs of code
        if (sourceSettings.refs)
          this.refs = new Map(Object.entries(sourceSettings.refs) as any);

        this._exists = true;
      })
      .catch((e) => {
        if (Array.isArray(e) && e[0] === "WRONG_TYPES")
          throw new Error(
            `Source with name ${this.name} has different type in OBS than expected. Found: ${e[1]}, Expected: ${this.type}`
          );

        return (this._exists = false);
      })
      .finally(() => (this._initialized = true)) as Promise<true>;
  }

  /**
   * Creates a scene item of this source in the provided scene.
   * Requires that this source has already been created by a scene with `Scene.create`.
   *
   * @returns A SceneItem created by `Source.createSceneItem`
   * @internal
   */
  async createItem(ref: ItemRef, scene: Scene): Promise<SceneItem<this>> {
    // Source must exist so that `refs` is populated
    if (!this.exists)
      throw new Error(
        `Source.createItem called on source ${this.name} that doesn't exist yet!`
      );

    // First, attempt to connect to existing scene item with provided ref
    const id = this.refs.get(`${scene.name}:${ref}`);

    // If a ref exists, we can reference the existing scene item
    if (id !== undefined) {
      const properties = await obs.getSceneItemProperties({
        id,
        scene: scene.name,
      });

      const item = this.createItemInstance(scene, id);

      item.properties = properties;

      return item;
    }

    // If no ref exists, we could try and look for items that match the source,
    // but that would defeat the point of `obs.clean`. Instead, we create a new item
    // of the source, keeping in mind that multiple items of a source can exist at once.
    // Thus, any old items of the source will exist alongisde the newly created item,
    // ready to be removed with `obs.clean`.

    // Also, not checking if a matching item already exists saves on OBS requests :)

    const { itemId } = await obs.addSceneItem({
      scene: scene.name,
      source: this.name,
    });

    // As we have created a new scene item, set the corresponding ref.
    this.addRef(`${scene.name}:${ref}`, itemId);

    // We don't fetch or assign scene item properties here since they're just going to be default

    return this.createItemInstance(scene, itemId);
  }

  /**
   * Creates an instance of the source with the provided data and marks itself as existing and
   * initialized, as if the source was created by code.
   *
   * TODO: Matching settings and filters?
   *
   * @internal
   * @throws If 0 or more than 1 item of this source are found in the scene
   */
  linkItem(scene: Scene, id: ItemID) {
    this._exists = true;
    this._initialized = true;

    return this.createItemInstance(scene, id);
  }

  /**
   * Creates the first item of this source, thereby creating both a source and a scene item in OBS.
   * Requires that the source does not exist yet.
   *
   * Could probably be merged with `Source.createItem` with checks for initialization.
   *
   * @returns A SceneItem created by `Source.createSceneItem`
   * @internal
   */
  async createInitialItem(
    ref: ItemRef,
    scene: Scene
  ): Promise<SceneItem<this>> {
    if (this.exists)
      throw new Error(
        `Source.createInitialItem called on source ${this.name} that already exists!`
      );

    const { itemId } = await obs.createSource({
      name: this.name,
      type: this.type,
      scene: scene.name,
      settings: this.settings,
    });

    // As we have created a new scene item, set the corresponding ref.
    this.addRef(`${scene.name}:${ref}`, itemId);

    return this.createItemInstance(scene, itemId);
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
  private refs = new Map<`${SceneName}:${ItemRef}`, ItemID>();

  /**
   * Sends this source's refs to OBS to be saved onto the source
   *
   * @throws If saving the refs fails
   */
  protected saveRefs() {
    // This isn't await-ed since the worst thing that can happen with a failed ref is a source is deleted by obs.clean.
    // We don't really care to know when it finishes.
    return obs.setSourceSettings({
      name: this.name,
      type: this.type,
      settings: {
        refs: [...this.refs.entries()].reduce(
          (acc, [k, v]) => ({ ...acc, [k]: v }),
          {}
        ),
      },
    });
  }

  protected addRef(ref: `${SceneName}:${ItemRef}`, id: ItemID) {
    this.refs.set(ref, id);

    this.saveRefs().catch((e) =>
      console.warn(`Failed to add ref ${ref} -> ${id}`, e)
    );
  }

  protected removeRef(ref: `${SceneName}:${ItemRef}`) {
    this.refs.delete(ref);

    this.saveRefs().catch((e) =>
      console.warn(`Failed to remove ref ${ref}`, e)
    );
  }
}
