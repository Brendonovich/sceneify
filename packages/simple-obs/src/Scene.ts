import { obs } from "./obs";
import { SceneItem, SceneItemProperties } from "./SceneItem";
import { ItemRef, Source, SourceSettings, SourceFilters } from "./Source";
import { DeepPartial } from "./types";
import { mergeDeep, wait } from "./utils";

type ItemSchemaInput<T extends Source = Source> = {
  source: T;
} & DeepPartial<SceneItemProperties>;

type ItemsSchemaInput<Items extends Record<string, Source>> = {
  [K in keyof Items]: ItemSchemaInput<Items[K]>;
};

interface LinkOptions {
  // requireItemOrder: boolean;
  // requireFilterOrder: boolean;
  setProperties: boolean;
  setSourceSettings: boolean;
}

export class Scene<
  Items extends Record<string, Source> = {},
  Settings extends SourceSettings = {},
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  type = "scene";

  // Default initialized to {} as items is populated later by initialize addItem
  items: {
    [K in keyof Items]: SceneItem<Items[K]>;
  } & Record<string, SceneItem> = {} as any;

  private itemsSchema: ItemsSchemaInput<Items>;

  /**
   * PUBLIC METHODS
   *
   * Methods that can be called by code that uses obs-js
   */

  /**  */
  constructor(args: {
    name: string;
    items: ItemsSchemaInput<Items>;
    filters?: Filters;
    settings?: DeepPartial<Settings>;
  }) {
    super(args);

    this.itemsSchema = args.items;
  }

  /**
   * Creates a scene in OBS and populates it with items as defined by the scene's items schema.
   *
   * Can be called normally, and is also called by `Scene.addItem` through the `Scene.createItem` override.
   */
  async create(): Promise<this> {
    // If scene exists, it is initialized. Thus, no need to throw an error if it's already initialized
    if (this.exists) return this;

    await super.initialize();

    if (!this.exists) {
      await obs.createScene(this.name);
      await this.saveRefs();
    }

    await wait(50);

    this._exists = true;
    obs.scenes.set(this.name, this);

    for (const ref in this.itemsSchema) {
      await this.addItem(ref, this.itemsSchema[ref]);
    }

    const itemList = await obs.getSceneItemList(this.name);

    let ownedItemIds = Object.keys(this.itemsSchema)
      .reverse()
      .map((ref) => this.items[ref].id);

    const allItemsOrdered = [
      ...itemList.sceneItems
        .filter(({ itemId }) => !ownedItemIds.includes(itemId))
        .map(({ itemId }) => itemId)
        .reverse(),
      ...ownedItemIds,
    ];

    if (allItemsOrdered.length > 0)
      await obs.reorderSceneItems({
        scene: this.name,
        items: allItemsOrdered,
      });

    await this.setSettings({
      SIMPLE_OBS_LINKED: false,
    } as any);

    return this;
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
        async ([ref, { source, ...properties }]) => {
          const schemaItem = sceneItems.find(
            (i) => i.sourceName === source.name
          )!;

          // Create a SceneItem for the source, marking the source as inialized and such in the process
          const item: SceneItem<any> = source.linkItem(
            this,
            schemaItem.itemId,
            ref
          );

          Object.assign(this.items, { [ref]: item });

          await item.getProperties();

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
    } as any);

    // TODO: Ordering options
  }

  async addItem<T extends Source>(
    ref: string,
    { source, ...properties }: ItemSchemaInput<T>
  ) {
    // We only need to update the source after the first time the source is initialized
    const sourceNeedsUpdating = !source.initalized;

    // First, check if the source is initialized to ensure that `source.exists` is accurate
    let initialized = source.initialize();

    if (initialized !== true) await initialized;

    let item: SceneItem;

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

    // Get the item's properties and assign them in case some properties are dependent
    // on things like source settings (eg. Image source, where width and height is dependent
    // on the size of the image)
    const data = await item.getProperties();
    mergeDeep(item.properties, data);

    Object.assign(this.items, { [ref]: item });

    return item;
  }

  /**
   * Just wraps `obs.createScene` and sets `this._exists`
   */
  private async _create() {}

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

    this._exists = false;
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
  override async createItem(
    ref: ItemRef,
    scene: Scene
  ): Promise<SceneItem<this>> {
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
