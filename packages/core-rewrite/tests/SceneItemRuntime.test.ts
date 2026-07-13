import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { InputType } from "../src/InputType.js";
import { Input } from "../src/Input.js";
import { SceneItem } from "../src/SceneItem.js";
import { MockOBSSocket } from "../src/index.js";
import { createMockOBSSocket } from "./helpers.js";

class BrowserSource extends InputType("browser_source")({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
}) {}

const createTestSceneItem = Effect.fnUntraced(function* (options?: {
  declared?: boolean;
  mock?: MockOBSSocket.Options;
}) {
  const mock = createMockOBSSocket({
    inputs: [
      {
        name: "Chat",
        kind: "browser_source",
        settings: { width: 1920, height: 1080 },
      },
      { name: "Camera", kind: "av_capture_input_v2" },
      { name: "Logo", kind: "image_source" },
    ],
    scenes: [
      {
        name: "Main Scene",
        items: [
          {
            id: 42,
            sourceName: "Chat",
            transform: {
              positionX: 100,
              positionY: 200,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
            },
          },
          { id: 43, sourceName: "Camera" },
          { id: 44, sourceName: "Logo" },
        ],
      },
    ],
    ...options?.mock,
  });
  const input = yield* Input.make<typeof BrowserSource>(
    "Chat",
    "browser_source"
  ).pipe(Effect.provide(mock.layer));
  const item = yield* SceneItem.make(
    42,
    "Main Scene",
    input,
    options?.declared ?? true
  ).pipe(Effect.provide(mock.layer));
  return { item, calls: mock.calls, snapshot: mock.snapshot };
});

describe("SceneItem", () => {
  describe("properties", () => {
    it("should expose id, sceneName, input, and declared", () =>
      Effect.gen(function* () {
        const { item } = yield* createTestSceneItem();

        expect(item.id).toBe(42);
        expect(item.sceneName).toBe("Main Scene");
        expect(item.input.name).toBe("Chat");
        expect(item.declared).toBe(true);
      }));
  });

  describe("getTransform", () => {
    it("should get transform from OBS", () =>
      Effect.gen(function* () {
        const mockTransform = {
          positionX: 100,
          positionY: 200,
          scaleX: 1.0,
          scaleY: 1.0,
          rotation: 0,
        };

        const { item, calls } = yield* createTestSceneItem();

        expect(yield* item.getTransform()).toMatchObject(mockTransform);
        expect(calls[0]?.requestData).toEqual({
          sceneName: "Main Scene",
          sceneItemId: 42,
        });
      }));
  });

  describe("setTransform", () => {
    it("should set transform on OBS", () =>
      Effect.gen(function* () {
        const { item, calls, snapshot } = yield* createTestSceneItem();

        yield* item.setTransform({ positionX: 300, positionY: 400 });

        expect(calls).toContainEqual({
          requestType: "SetSceneItemTransform",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemTransform: { positionX: 300, positionY: 400 },
          },
        });
        expect(snapshot().scenes[0]?.items[0]?.transform).toMatchObject({
          positionX: 300,
          positionY: 400,
          scaleX: 1,
          scaleY: 1,
        });
      }));
  });

  describe("setEnabled", () => {
    it("should set enabled state on OBS", () =>
      Effect.gen(function* () {
        const { item, calls, snapshot } = yield* createTestSceneItem();

        yield* item.setEnabled(false);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemEnabled",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemEnabled: false,
          },
        });
        expect(snapshot().scenes[0]?.items[0]?.enabled).toBe(false);
      }));
  });

  describe("setLocked", () => {
    it("should set locked state on OBS", () =>
      Effect.gen(function* () {
        const { item, calls, snapshot } = yield* createTestSceneItem();

        yield* item.setLocked(true);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemLocked",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemLocked: true,
          },
        });
        expect(snapshot().scenes[0]?.items[0]?.locked).toBe(true);
      }));
  });

  describe("setIndex", () => {
    it("should set index on OBS", () =>
      Effect.gen(function* () {
        const { item, calls, snapshot } = yield* createTestSceneItem();

        yield* item.setIndex(3);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemIndex",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemIndex: 3,
          },
        });
        expect(snapshot().scenes[0]?.items.map(({ id }) => id)).toEqual([
          43, 44, 42,
        ]);
      }));
  });

  describe("remove", () => {
    it("should fail when trying to remove a declared item", () =>
      Effect.gen(function* () {
        const { item } = yield* createTestSceneItem({
          declared: true,
        });

        const either = yield* Effect.either(item.remove());
        expect(either._tag).toBe("Left");
      }));

    it("should succeed for dynamically created items", () =>
      Effect.gen(function* () {
        const { item, calls, snapshot } = yield* createTestSceneItem({
          declared: false,
        });

        yield* item.remove();

        expect(calls).toContainEqual({
          requestType: "RemoveSceneItem",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
          },
        });
        expect(snapshot().scenes[0]?.items.map(({ id }) => id)).toEqual([
          43, 44,
        ]);
      }));

    it("should not send any OBS calls when removing a declared item", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          declared: true,
        });

        yield* Effect.either(item.remove());

        const removeCalls = calls.filter(
          (c) => c.requestType === "RemoveSceneItem"
        );
        expect(removeCalls).toHaveLength(0);
      }));
  });
});
