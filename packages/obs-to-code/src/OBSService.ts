import { Context, Effect, Layer } from "effect";
import { OBSSocket } from "@sceneify/core-rewrite";
import type { OBSData, OBSInput, OBSScene } from "./OBSFetcher.ts";
import type { OBSError } from "@sceneify/core-rewrite";

export interface OBSService {
  readonly fetchAllData: Effect.Effect<OBSData, OBSError, OBSSocket.OBSSocket>;
}

export const OBSService = Context.GenericTag<OBSService>(
  "@sceneify/obs-to-code/OBSService"
);

const fetchInputsEffect = (
  obs: OBSSocket.OBSSocket
): Effect.Effect<OBSInput[], OBSError, OBSSocket.OBSSocket> =>
  Effect.gen(function* () {
    const result = yield* obs.call("GetInputList");
    const inputs = result.inputs as Array<{
      inputName: string;
      inputKind: string;
    }>;

    const inputsWithDetails = yield* Effect.all(
      inputs.map((input) =>
        Effect.gen(function* () {
          const [settingsResult, filtersResult] = yield* Effect.all([
            obs.call("GetInputSettings", { inputName: input.inputName }),
            obs.call("GetSourceFilterList", { sourceName: input.inputName }),
          ]);

          const filters = yield* Effect.all(
            (filtersResult.filters as any[]).map((filter) =>
              Effect.gen(function* () {
                const filterSettings = yield* obs.call("GetSourceFilter", {
                  sourceName: input.inputName,
                  filterName: filter.filterName as string,
                });

                return {
                  name: filter.filterName as string,
                  kind: filter.filterKind as string,
                  settings: filterSettings.filterSettings as Record<
                    string,
                    unknown
                  >,
                  enabled: filter.filterEnabled as boolean,
                };
              })
            )
          );

          return {
            name: input.inputName,
            kind: input.inputKind,
            settings: settingsResult.inputSettings as Record<string, unknown>,
            filters,
          };
        })
      )
    );

    return inputsWithDetails;
  });

const fetchScenesEffect = (
  obs: OBSSocket.OBSSocket
): Effect.Effect<OBSScene[], OBSError, OBSSocket.OBSSocket> =>
  Effect.gen(function* () {
    const result = yield* obs.call("GetSceneList");
    const scenes = result.scenes as Array<{ sceneName: string }>;

    const scenesWithItems = yield* Effect.all(
      scenes.map((scene) =>
        Effect.gen(function* () {
          const { sceneItems } = yield* obs.call("GetSceneItemList", {
            sceneName: scene.sceneName,
          });

          const items = yield* Effect.all(
            (sceneItems as any[]).map((item) =>
              Effect.gen(function* () {
                const { sceneItemTransform } = yield* obs.call(
                  "GetSceneItemTransform",
                  {
                    sceneName: scene.sceneName,
                    sceneItemId: item.sceneItemId as number,
                  }
                );

                const transform = sceneItemTransform as Record<string, number>;

                return {
                  sceneItemId: item.sceneItemId as number,
                  sourceName: item.sourceName as string,
                  sourceKind: item.sourceKind as string,
                  sceneItemEnabled: item.sceneItemEnabled as boolean,
                  sceneItemLocked: item.sceneItemLocked as boolean,
                  sceneItemIndex: item.sceneItemIndex as number,
                  transform: {
                    positionX: transform.positionX,
                    positionY: transform.positionY,
                    scaleX: transform.scaleX,
                    scaleY: transform.scaleY,
                    rotation: transform.rotation,
                    cropTop: transform.cropTop,
                    cropBottom: transform.cropBottom,
                    cropLeft: transform.cropLeft,
                    cropRight: transform.cropRight,
                  },
                };
              })
            )
          );

          items.sort((a, b) => a.sceneItemIndex - b.sceneItemIndex);

          return {
            name: scene.sceneName,
            items,
          };
        })
      )
    );

    return scenesWithItems;
  });

export const OBSServiceLive = Layer.succeed(
  OBSService,
  OBSService.of({
    fetchAllData: Effect.gen(function* () {
      const obs = yield* OBSSocket.OBSSocket;

      const [inputs, scenes] = yield* Effect.all([
        fetchInputsEffect(obs),
        fetchScenesEffect(obs),
      ]);

      return { inputs, scenes };
    }),
  })
);
