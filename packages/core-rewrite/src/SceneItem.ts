import { Effect } from "effect";
import { Input } from "./Input.ts";
import type { OBSError } from "./errors.ts";
import { OBSSocket } from "./OBSSocket.ts";

export namespace SceneItem {
  export interface Transform {
    positionX?: number;
    positionY?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    cropLeft?: number;
    cropRight?: number;
    cropTop?: number;
    cropBottom?: number;
    alignment?: number;
    boundsType?: string;
    boundsAlignment?: number;
    boundsWidth?: number;
    boundsHeight?: number;
    sourceWidth?: number;
    sourceHeight?: number;
  }

  /**
   * A declared scene item - a source (input or scene) placed in a scene with optional
   * transform, index, enabled, and lock properties.
   */
  export type SceneItemDecl<
    TSource extends Input.Declaration<any, any> = Input.Declaration<any, any>
  > = {
    readonly source: TSource;
    readonly index?: number;
    readonly enabled?: boolean;
    readonly lock?: boolean;
    readonly transform?: Transform;
  };

  /**
   * Runtime representation of a scene item in OBS.
   * OBSSocket is captured at creation time - methods return Effects
   * that do not require OBSSocket in context.
   */
  export interface SceneItem<
    TSource extends Input.Declaration<any, any> = Input.Declaration<any, any>
  > {
    /** The OBS scene item ID */
    readonly id: number;
    /** The scene name this item belongs to */
    readonly sceneName: string;
    /** The runtime input this item references */
    readonly input: Input.Input<TSource["type"]>;
    /** Whether this item was part of a scene declaration (cannot be removed) */
    readonly declared: boolean;

    /** Get the current transform */
    readonly getTransform: () => Effect.Effect<Transform, OBSError>;
    /** Set the transform */
    readonly setTransform: (
      transform: Partial<Transform>
    ) => Effect.Effect<void, OBSError>;
    /** Set enabled/visible */
    readonly setEnabled: (enabled: boolean) => Effect.Effect<void, OBSError>;
    /** Set locked */
    readonly setLocked: (locked: boolean) => Effect.Effect<void, OBSError>;
    /** Set the index/order in the scene */
    readonly setIndex: (index: number) => Effect.Effect<void, OBSError>;
    /** Remove from scene (throws if declared) */
    readonly remove: () => Effect.Effect<void, OBSError>;
  }

  /**
   * Creates a SceneItem runtime from an ID, scene name, and Input.
   * The OBSSocket is captured at creation and used for all subsequent calls.
   */
  export const make = Effect.fnUntraced(function* <
    TInput extends Input.Declaration<any, any>
  >(
    id: number,
    sceneName: string,
    input: Input.Input<TInput["type"]>,
    declared: boolean
  ) {
    const obs = yield* OBSSocket;

    return {
      id,
      sceneName,
      input,
      declared,

      getTransform: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetSceneItemTransform", {
            sceneName,
            sceneItemId: id,
          });
          return result.sceneItemTransform as Transform;
        }),

      setTransform: (transform) =>
        Effect.gen(function* () {
          yield* obs.call("SetSceneItemTransform", {
            sceneName,
            sceneItemId: id,
            sceneItemTransform: transform,
          });
        }),

      setEnabled: (enabled) =>
        Effect.gen(function* () {
          yield* obs.call("SetSceneItemEnabled", {
            sceneName,
            sceneItemId: id,
            sceneItemEnabled: enabled,
          });
        }),

      setLocked: (locked) =>
        Effect.gen(function* () {
          yield* obs.call("SetSceneItemLocked", {
            sceneName,
            sceneItemId: id,
            sceneItemLocked: locked,
          });
        }),

      setIndex: (index) =>
        Effect.gen(function* () {
          yield* obs.call("SetSceneItemIndex", {
            sceneName,
            sceneItemId: id,
            sceneItemIndex: index,
          });
        }),

      remove: () =>
        Effect.gen(function* () {
          if (declared) {
            return yield* Effect.fail({
              _tag: "OBSError" as const,
              message: `Cannot remove declared scene item (id: ${id}) from scene "${sceneName}". Only dynamically created items can be removed.`,
            } as OBSError);
          }
          yield* obs.call("RemoveSceneItem", {
            sceneName,
            sceneItemId: id,
          });
        }),
    } as SceneItem.SceneItem<TInput>;
  });
}
