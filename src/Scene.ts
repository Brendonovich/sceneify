import { FilterSchema, obs, SceneItem } from ".";
import { SceneItemProperties } from "./SceneItem";
import { ItemRef, Source } from "./Source";
import { DeepPartial } from "./types";

export type SceneItemsSchema = Record<string, ItemSchema>;

type ItemSchema<T extends Source = Source> = {
  source: T;
} & DeepPartial<SceneItemProperties>;

type FiltersSchema = Record<string, FilterSchema>;

interface Args<Items extends SceneItemsSchema, Filters extends FiltersSchema> {
  name: string;
  items: Items;
  filters?: Filters;
}

interface LinkOptions {
  // requireItemOrder: boolean;
  // requireFilterOrder: boolean;
  setProperties: boolean;
  setSourceSettings: boolean;
}

export class Scene<
  Items extends SceneItemsSchema = SceneItemsSchema,
  Filters extends FiltersSchema = {}
> extends Source<{}, Filters> {
  type = "scene";

  // Default initialized to {} as items is populated later by initialize addItem
  items: { [K in keyof Items]: SceneItem<Items[K]["source"]> } = {} as any;

  private itemsSchema: Items;

  /**
   * PUBLIC METHODS
   *
   * Methods that can be called by code that uses obs-js
   */

  /**  */
  constructor({ name, items: itemsSchema, filters }: Args<Items, Filters>) {
    super({
      name,
      settings: {},
      filters,
    });

    this.itemsSchema = itemsSchema;
  }

  /**
   * Creates a scene in OBS and populates it with items as defined by the scene's items schema.
   *
   * Can be called normally, and is also called by `Scene.addItem` through the `Scene.createItem` override.
   */
  async create(): Promise<true> {
    if (this.initalized)
      throw new Error(
        `Cannot create scene ${this.name} that has already been initialized`
      );

    if (this.exists) return true;

    // Try to create the scene in OBS, and just continue if it already exists
    await this._create().catch(() => {});

    await Promise.all(
      Object.entries(this.itemsSchema).map(([ref, schema]) =>
        this.addItem(ref, schema)
      )
    );

    await this.setSettings({
      SIMPLE_OBS_LINKED: false,
    });


    // TODO: Reordering

    this._initialized = true;

    return true;
  }

  /**
   * Links to an existing scene in OBS, verifying that all sources as defined by the scene's items schema exist.
   * Will mark itself as existing if a matching scene is found, but will still throw if the items schema is not matched.
   */
  async link(options?: Partial<LinkOptions>) {
    if (this.initalized)
      throw new Error(
        `Cannot link scene ${this.name} that has already been initialized`
      );

    // First, check if the scene exists by fetching its scene item list. Fail if scene isn't found
    const { sceneItems } = await obs.getSceneItemList(this.name);

    this._exists = true;

    let multipleItemSources = [],
      noItemSources = [];

    // Iterate through the required items a first time to determine if the scene can be linked
    for (let ref in this.itemsSchema) {
      let itemSchema = this.itemsSchema[ref];

      // Get all items in scene with current item's source type
      const sourceItems = sceneItems.filter(
        (i) => i.sourceName === itemSchema.source.name
      );

      if (sourceItems.length === 0) multipleItemSources.push(itemSchema.source);
      else if (sourceItems.length > 1) noItemSources.push(itemSchema.source);
      else continue;
    }

    // If multiple or none of any of the sources exist as items in the scene, fail
    if (multipleItemSources.length !== 0 || noItemSources.length !== 0)
      throw new Error(
        `Failed to link scene ${this.name}:${
          multipleItemSources.length !== 0
            ? ` Scene contians multiple items of source${
                multipleItemSources.length > 1 ? "s" : ""
              } ${multipleItemSources.map((s) => `'${s.name}'`).join(", ")}.`
            : ``
        }${
          noItemSources.length !== 0
            ? ` Scene contians no items of source${
                noItemSources.length > 1 ? "s" : ""
              } ${noItemSources.map((s) => `'${s.name}'`).join(", ")}.`
            : ``
        }`
      );

    // Iterate through a second time to actually link the scene items.
    await Promise.all(
      Object.entries(this.itemsSchema).map(
        ([ref, { source, ...properties }]) => {
          const schemaItem = sceneItems.find(
            (i) => i.sourceName === source.name
          )!;

          // Create a SceneItem for the source, marking the source as inialized and such in the process
          const item = source.linkItem(this, schemaItem.itemId, ref);

          this.items[ref as keyof Items] = item;

          let optionRequests: Promise<any>[] = [];
          if (options?.setProperties)
            optionRequests.push(item.setProperties(properties));
          if (options?.setSourceSettings)
            optionRequests.push(source.setSettings(source.settings));

          return Promise.all(optionRequests);
        }
      )
    );

    await this.setSettings({
      SIMPLE_OBS_LINKED: true,
    });

    // TODO: Ordering options
  }

  async addItem<T extends Source>(
    ref: string,
    { source, ...properties }: ItemSchema<T>
  ) {
    // We only need to update the source after the first time the source is initialized
    const sourceNeedsUpdating = !source.initalized;

    // First, check if the source is initialized to ensure that `source.exists` is accurate
    let initialized = source.initialize();

    if (initialized !== true) await initialized;

    let item: SceneItem<T>;

    // Source is initialized, try to create an item of it, letting the source be
    // responsible for creating itself if required
    item = await source.createItem(ref, this);

    const sourceUpdateRequests = sourceNeedsUpdating
      ? [
          source.setSettings(source.settings),
          // source.refreshFilters()
        ]
      : [];

    // We always need to set the item properties, but only need to set source settings and the like once
    // when we initalize the source
    await Promise.all<any>([
      item.setProperties(properties),
      ...sourceUpdateRequests,
    ]);

    this.items[ref as keyof Items] = item;
  }

  /**
   * Just wraps `obs.createScene` and sets `this._exists`
   */
  private async _create() {
    await super.initialize();

    if (!this.exists) {
      await obs.createScene(this.name);
      await this.saveRefs();
    }

    this._exists = true;
    obs.scenes.set(this.name, this);
  }

  /**
   * UTILITIES
   *
   * Utility functions that wrap basic OBS functions.
   */

  /** */
  makeCurrentScene() {
    return obs.setCurrentScene(this.name);
  }

  async remove() {
    await obs.removeScene(this.name);
    obs.scenes.delete(this.name);
    obs.sources.delete(this.name);
  }

  /**
   * CREATE ITEM OVERRIDES
   *
   * These are necessary since Scenes are different from regular Sources in how they
   * generate. They don't have a concept of an initial item as they can exist with 0 items.
   * Thus as long as the scene is initialized, `createInitialItem` can just call regular `createItem`
   */

  /**
   * @internal
   * @override
   */
  async createItem(ref: ItemRef, scene: Scene): Promise<SceneItem<this>> {
    if (!this.exists) await this.create();

    return await super.createItem(ref, scene);
  }

  /**
   * @internal
   * @override
   */
  createInitialItem(ref: ItemRef, scene: Scene) {
    return this.createItem(ref, scene);
  }
}
