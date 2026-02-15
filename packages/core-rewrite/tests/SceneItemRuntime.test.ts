import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { InputType } from "../src/InputType.js";
import { Input } from "../src/Input.js";
import { SceneItem } from "../src/SceneItem.js";
import { createMockOBSSocket, type CallHandler } from "./helpers.js";

class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
}>() {}

const createTestSceneItem = Effect.fnUntraced(function* (options?: {
  declared?: boolean;
  handlers?: Record<string, CallHandler>;
}) {
  const mock = createMockOBSSocket({ handlers: options?.handlers });
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
  return { item, calls: mock.calls };
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

        const { item, calls } = yield* createTestSceneItem({
          handlers: {
            GetSceneItemTransform: () => ({
              sceneItemTransform: mockTransform,
            }),
          },
        });

        expect(yield* item.getTransform()).toEqual(mockTransform);
        expect(calls[0]?.requestData).toEqual({
          sceneName: "Main Scene",
          sceneItemId: 42,
        });
      }));
  });

  describe("setTransform", () => {
    it("should set transform on OBS", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          handlers: { SetSceneItemTransform: () => ({}) },
        });

        yield* item.setTransform({ positionX: 300, positionY: 400 });

        expect(calls).toContainEqual({
          requestType: "SetSceneItemTransform",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemTransform: { positionX: 300, positionY: 400 },
          },
        });
      }));
  });

  describe("setEnabled", () => {
    it("should set enabled state on OBS", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          handlers: { SetSceneItemEnabled: () => ({}) },
        });

        yield* item.setEnabled(false);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemEnabled",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemEnabled: false,
          },
        });
      }));
  });

  describe("setLocked", () => {
    it("should set locked state on OBS", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          handlers: { SetSceneItemLocked: () => ({}) },
        });

        yield* item.setLocked(true);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemLocked",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemLocked: true,
          },
        });
      }));
  });

  describe("setIndex", () => {
    it("should set index on OBS", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          handlers: { SetSceneItemIndex: () => ({}) },
        });

        yield* item.setIndex(3);

        expect(calls).toContainEqual({
          requestType: "SetSceneItemIndex",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
            sceneItemIndex: 3,
          },
        });
      }));
  });

  describe("remove", () => {
    it("should fail when trying to remove a declared item", () =>
      Effect.gen(function* () {
        const { item } = yield* createTestSceneItem({
          declared: true,
          handlers: { RemoveSceneItem: () => ({}) },
        });

        const either = yield* Effect.either(item.remove());
        expect(either._tag).toBe("Left");
      }));

    it("should succeed for dynamically created items", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          declared: false,
          handlers: { RemoveSceneItem: () => ({}) },
        });

        yield* item.remove();

        expect(calls).toContainEqual({
          requestType: "RemoveSceneItem",
          requestData: {
            sceneName: "Main Scene",
            sceneItemId: 42,
          },
        });
      }));

    it("should not send any OBS calls when removing a declared item", () =>
      Effect.gen(function* () {
        const { item, calls } = yield* createTestSceneItem({
          declared: true,
          handlers: { RemoveSceneItem: () => ({}) },
        });

        yield* Effect.either(item.remove());

        const removeCalls = calls.filter(
          (c) => c.requestType === "RemoveSceneItem"
        );
        expect(removeCalls).toHaveLength(0);
      }));
  });
});
