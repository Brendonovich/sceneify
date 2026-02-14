import { Effect } from "effect";
import { Input } from "./Input.ts";
import type { InputType, InputTypeSettings } from "./InputType.ts";
import { InputAlreadyExistsError, type OBSError } from "./errors.ts";
import { OBSSocket } from "./OBSSocket.ts";
import { Sceneify } from "./Sceneify.ts";
import { SceneItem } from "./SceneItem.ts";
import { Filter } from "./Filter.ts";
import type { FilterType } from "./FilterType.ts";

const SOURCE_ALREADY_EXISTS_RE = /a source already exists by that input name/i;

const catchInputAlreadyExists =
  (inputName: string) =>
  <A, R>(effect: Effect.Effect<A, OBSError, R>) =>
    Effect.catchIf(
      effect,
      (error) => SOURCE_ALREADY_EXISTS_RE.test(error.message),
      () => Effect.fail(new InputAlreadyExistsError({ inputName }))
    );

export namespace Scene {
  /**
   * Plain config for dynamically creating a scene item at runtime.
   * Unlike Input.declare, this is not tracked or deduplicated.
   */
  export interface CreateItemConfig<
    TType extends InputType<string, any> = InputType<string, any>
  > {
    readonly type: TType;
    readonly name: string;
    readonly settings?: Partial<InputTypeSettings<TType>>;
  }

  type FiltersDeclaration<TFilters extends Record<string, FilterType>> = {
    [K in keyof TFilters]: Filter.Config<TFilters[K]>;
  };

  type ItemsDeclaration<TItems extends Record<string, Input.Declaration<any>>> =
    {
      [K in keyof TItems]: SceneItem.SceneItemDecl<TItems[K]>;
    };

  export interface SceneDeclaration<
    TItems extends Record<string, Input.Declaration<any>>,
    TFilters extends Record<string, FilterType> = {}
  > {
    readonly name: string;
    readonly items: ItemsDeclaration<TItems>;
    readonly filters: FiltersDeclaration<TFilters>;
  }

  /**
   * Runtime representation of a scene in OBS.
   * Provides typed access to scene items.
   */
  export interface Scene<
    TItems extends Record<string, Input.Declaration<any>>
  > {
    /** The scene name */
    readonly name: string;

    /**
     * Get a scene item by its declaration key.
     * Returns a typed SceneItem with the correct source type.
     */
    readonly item: <K extends string & keyof TItems>(
      key: K
    ) => SceneItem.SceneItem<TItems[K]>;

    /**
     * Dynamically create a new scene item at runtime.
     * The returned item is NOT declared and can be removed.
     */
    readonly createItem: <TType extends InputType<string, any>>(
      config: CreateItemConfig<TType>
    ) => Effect.Effect<
      SceneItem.SceneItem<Input.Declaration<TType>>,
      OBSError | InputAlreadyExistsError,
      Sceneify
    >;
  }

  export const sync = <
    const TItems extends Record<
      string,
      Input.Declaration<InputType<string, any>>
    >,
    const TFilters extends Record<string, FilterType>
  >(
    declaration: SceneDeclaration<TItems, TFilters>
  ) => {
    return Effect.gen(function* () {
      const obs = yield* OBSSocket;
      const sceneify = yield* Sceneify;

      // Check if scene exists
      const scenes = yield* obs.call("GetSceneList");
      const exists = scenes.scenes.some(
        (s: any) => s.sceneName === declaration.name
      );

      if (!exists) {
        yield* obs.call("CreateScene", { sceneName: declaration.name });
      }

      // Create scene-level filters
      const sceneFilters = (declaration.filters ?? {}) as Record<
        string,
        {
          name: string;
          type: { kind: string };
          settings?: Record<string, any>;
          enabled?: boolean;
        }
      >;
      for (const [, filterDecl] of Object.entries(sceneFilters)) {
        const filterSettings = filterDecl.settings ?? {};
        const filterEnabled = filterDecl.enabled ?? true;

        yield* obs.call("CreateSourceFilter", {
          sourceName: declaration.name,
          filterName: filterDecl.name,
          filterKind: filterDecl.type.kind,
          filterSettings,
        });

        if (!filterEnabled) {
          yield* obs.call("SetSourceFilterEnabled", {
            sourceName: declaration.name,
            filterName: filterDecl.name,
            filterEnabled,
          });
        }
      }

      // Get current items in the scene
      const currentItems = yield* obs.call("GetSceneItemList", {
        sceneName: declaration.name,
      });
      const currentSceneItems = currentItems.sceneItems as Array<{
        sceneItemId: number;
        sourceName: string;
      }>;

      // Build runtime items map
      const runtimeItems: Record<string, SceneItem.SceneItem<any>> = {};

      for (const [key, item] of Object.entries(declaration.items)) {
        const inputExists = yield* sceneify.hasInput(item.source.name);

        let sceneItemId!: number;
        let inputAlreadyInOBS = false;

        if (!inputExists) {
          // Create the input in OBS
          yield* Effect.either(
            obs
              .call("CreateInput", {
                sceneName: declaration.name,
                inputName: item.source.name,
                inputKind: item.source.type.kind,
                inputSettings: item.source.settings,
              })
              .pipe(
                catchInputAlreadyExists(item.source.name),
                Effect.tap((r) =>
                  Effect.sync(() => {
                    sceneItemId = r.sceneItemId;
                  })
                ),
                Effect.catchTag("InputAlreadyExistsError", () =>
                  Effect.sync(() => {
                    inputAlreadyInOBS = true;
                  })
                )
              )
          );

          yield* sceneify.registerInput({
            name: item.source.name,
          });
        }

        if (inputExists || inputAlreadyInOBS) {
          // Input already exists, find or create scene item
          const existingItem = currentSceneItems.find(
            (i) => i.sourceName === item.source.name
          );

          if (existingItem) {
            sceneItemId = existingItem.sceneItemId;
          } else {
            // Add existing input to this scene
            const result = yield* obs.call("CreateSceneItem", {
              sceneName: declaration.name,
              sourceName: item.source.name,
              sceneItemEnabled: item.enabled ?? true,
            });
            sceneItemId = result.sceneItemId;
          }

          // Apply declared settings to the existing input
          if (
            item.source.settings &&
            Object.keys(item.source.settings).length > 0
          ) {
            yield* obs.call("SetInputSettings", {
              inputName: item.source.name,
              inputSettings: item.source.settings,
            });
          }
        }

        // Apply transform if specified
        if (item.transform) {
          yield* obs.call("SetSceneItemTransform", {
            sceneName: declaration.name,
            sceneItemId,
            sceneItemTransform: item.transform as any,
          });
        }

        // Apply enabled state if specified
        if (item.enabled !== undefined) {
          yield* obs.call("SetSceneItemEnabled", {
            sceneName: declaration.name,
            sceneItemId,
            sceneItemEnabled: item.enabled,
          });
        }

        // Apply locked state if specified
        if (item.lock !== undefined) {
          yield* obs.call("SetSceneItemLocked", {
            sceneName: declaration.name,
            sceneItemId,
            sceneItemLocked: item.lock,
          });
        }

        // Create filters for this input (only when the input was freshly created)
        const filterInstances: Record<string, Filter.Filter<any>> = {};
        const declaredFilters = (item.source.filters ?? {}) as Record<
          string,
          {
            name: string;
            type: { kind: string };
            settings?: Record<string, any>;
            enabled?: boolean;
          }
        >;
        for (const [filterKey, filterDecl] of Object.entries(declaredFilters)) {
          if (!inputExists && !inputAlreadyInOBS) {
            const filterSettings = filterDecl.settings ?? {};
            const filterEnabled = filterDecl.enabled ?? true;

            yield* obs.call("CreateSourceFilter", {
              sourceName: item.source.name,
              filterName: filterDecl.name,
              filterKind: filterDecl.type.kind,
              filterSettings,
            });

            if (!filterEnabled) {
              yield* obs.call("SetSourceFilterEnabled", {
                sourceName: item.source.name,
                filterName: filterDecl.name,
                filterEnabled,
              });
            }
          }

          filterInstances[filterKey] = yield* Filter.make(
            filterDecl.name,
            item.source.name
          );
        }

        // Create Input runtime
        const inputInstance = yield* Input.make(
          item.source.name,
          item.source.type.kind,
          filterInstances
        );

        // Create SceneItem runtime
        runtimeItems[key] = yield* SceneItem.make(
          sceneItemId,
          declaration.name,
          inputInstance,
          true // declared items
        );
      }

      // Remove stale items not in the declaration
      const declaredNames = new Set(
        Object.values(declaration.items).map((i) => i.source.name)
      );
      for (const current of currentSceneItems) {
        if (!declaredNames.has(current.sourceName)) {
          yield* obs.call("RemoveSceneItem", {
            sceneName: declaration.name,
            sceneItemId: current.sceneItemId,
          });
        }
      }

      // Return Scene runtime
      const sceneName = declaration.name;
      const scene: Scene<TItems> = {
        name: sceneName,
        item: (key) => runtimeItems[key],

        createItem: (config) =>
          Effect.gen(function* () {
            const inputExists = yield* sceneify.hasInput(config.name);

            let sceneItemId: number;

            if (!inputExists) {
              const result = yield* obs
                .call("CreateInput", {
                  sceneName: sceneName,
                  inputName: config.name,
                  inputKind: config.type.kind,
                  inputSettings: (config.settings as any) ?? {},
                })
                .pipe(catchInputAlreadyExists(config.name));

              sceneItemId = result.sceneItemId;
              yield* sceneify.registerInput({ name: config.name });
            } else {
              const result = yield* obs.call("CreateSceneItem", {
                sceneName,
                sourceName: config.name,
              });

              sceneItemId = result.sceneItemId;
            }

            const inputInstance = yield* Input.make(
              config.name,
              config.type.kind
            );

            return yield* SceneItem.make(
              sceneItemId,
              sceneName,
              inputInstance,
              false
            );
          }).pipe(Effect.provideService(OBSSocket, obs)),
      };

      return scene;
    });
  };

  export const declare = <
    const TItems extends Record<string, Input.Declaration<any>>,
    const TFilters extends Record<string, FilterType> = {}
  >(options: {
    name: string;
    items: ItemsDeclaration<TItems>;
    filters?: FiltersDeclaration<TFilters>;
  }): SceneDeclaration<TItems, TFilters> => {
    return {
      name: options.name,
      items: options.items,
      filters: options.filters ?? ({} as FiltersDeclaration<TFilters>),
    };
  };
}
