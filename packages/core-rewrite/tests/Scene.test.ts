import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { InputType } from "../src/InputType.js";
import { FilterType } from "../src/FilterType.js";
import { Input } from "../src/Input.js";
import { Scene } from "../src/Scene.js";
import { Sceneify } from "../src/Sceneify.js";
import { runEffect, type CallHandler } from "./helpers.js";

// Test InputTypes
class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
}>() {}

class ColorSource extends InputType("color_source_v3")<{
  color: number;
  width: number;
  height: number;
}>() {}

// Test FilterTypes
class ColorCorrection extends FilterType("color_filter_v2")<{
  gamma: number;
  contrast: number;
  brightness: number;
}>() {}

// Default handlers for fresh scene creation (no existing scenes/items)
function freshSceneHandlers(
  overrides: Record<string, CallHandler> = {}
): Record<string, CallHandler> {
  let sceneItemIdCounter = 1;
  return {
    GetSceneList: () => ({ scenes: [] }),
    CreateScene: () => ({}),
    GetSceneItemList: () => ({ sceneItems: [] }),
    CreateInput: () => ({ sceneItemId: sceneItemIdCounter++ }),
    CreateSceneItem: () => ({ sceneItemId: sceneItemIdCounter++ }),
    SetInputSettings: () => ({}),
    SetSceneItemTransform: () => ({}),
    SetSceneItemEnabled: () => ({}),
    SetSceneItemLocked: () => ({}),
    ...overrides,
  };
}

describe("Scene.sync", () => {
  it("should create a scene in OBS when it does not exist", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
      settings: { url: "https://twitch.tv/chat" },
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    await result;

    const createSceneCall = calls.find((c) => c.requestType === "CreateScene");
    expect(createSceneCall).toBeDefined();
    expect(createSceneCall?.requestData).toEqual({
      sceneName: "Main Scene",
    });
  });

  it("should not create a scene if it already exists", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers({
        GetSceneList: () => ({
          scenes: [{ sceneName: "Main Scene", sceneIndex: 0 }],
        }),
      }),
    });

    await result;

    const createSceneCall = calls.find((c) => c.requestType === "CreateScene");
    expect(createSceneCall).toBeUndefined();
  });

  it("should create inputs via OBS", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
      settings: { url: "https://twitch.tv/chat", width: 1920 },
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    await result;

    const createInputCall = calls.find((c) => c.requestType === "CreateInput");
    expect(createInputCall).toBeDefined();
    expect(createInputCall?.requestData).toMatchObject({
      inputName: "Chat",
      inputKind: "browser_source",
      inputSettings: { url: "https://twitch.tv/chat", width: 1920 },
    });
  });

  it("should return a SceneRuntime with a name property", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    const scene = await result;
    expect(scene.name).toBe("Main Scene");
  });

  it("should provide typed item access via .item(key)", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
      settings: { url: "https://twitch.tv/chat" },
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    const scene = await result;
    const chatItem = scene.item("chat");
    expect(chatItem).toBeDefined();
    expect(chatItem.input.name).toBe("Chat");
  });

  it("should assign scene item IDs from OBS responses", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    let nextId = 42;
    const { result } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers({
        CreateInput: () => ({ sceneItemId: nextId++ }),
      }),
    });

    const scene = await result;
    expect(scene.item("chat").id).toBe(42);
  });

  it("should handle multiple items in a scene", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
      settings: { url: "https://twitch.tv/chat" },
    });

    const bgInput = Input.declare(ColorSource, {
      name: "Background",
      settings: { color: 0xff0000, width: 1920, height: 1080 },
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
        bg: { source: bgInput },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    const scene = await result;

    expect(scene.item("chat").input.name).toBe("Chat");
    expect(scene.item("bg").input.name).toBe("Background");

    const createInputCalls = calls.filter(
      (c) => c.requestType === "CreateInput"
    );
    expect(createInputCalls).toHaveLength(2);
  });

  it("should apply transform when creating new scene items", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: {
          source: chatInput,
          transform: { positionX: 100, positionY: 200 },
        },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers(),
    });

    await result;

    const transformCall = calls.find(
      (c) => c.requestType === "SetSceneItemTransform"
    );
    expect(transformCall).toBeDefined();
    expect(transformCall?.requestData).toMatchObject({
      sceneItemTransform: { positionX: 100, positionY: 200 },
    });
  });

  it("should not duplicate inputs already registered in Sceneify", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    // Pre-register the input, then create the scene.
    // The input should not be created again.
    const effect = Effect.gen(function* () {
      const sceneify = yield* Sceneify;
      yield* sceneify.registerInput({ name: "Chat" });
      return yield* Scene.sync(declaration);
    });

    const { result, calls } = runEffect(effect, {
      handlers: freshSceneHandlers({
        GetSceneItemList: () => ({
          sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
        }),
      }),
    });

    await result;

    const createInputCalls = calls.filter(
      (c) => c.requestType === "CreateInput"
    );
    expect(createInputCalls).toHaveLength(0);
  });

  it("should remove stale items not in the declaration", async () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { result, calls } = runEffect(Scene.sync(declaration), {
      handlers: freshSceneHandlers({
        GetSceneItemList: () => ({
          sceneItems: [{ sceneItemId: 99, sourceName: "Old Stale Input" }],
        }),
      }),
    });

    await result;

    const removeCall = calls.find((c) => c.requestType === "RemoveSceneItem");
    expect(removeCall).toBeDefined();
    expect(removeCall?.requestData).toMatchObject({
      sceneName: "Main Scene",
      sceneItemId: 99,
    });
  });

  describe("filter lifecycle", () => {
    it("should create filters on inputs during scene creation", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
        settings: { url: "https://twitch.tv/chat" },
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            settings: { gamma: 1.5 },
          },
        },
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { result, calls } = runEffect(Scene.sync(declaration), {
        handlers: freshSceneHandlers({
          CreateSourceFilter: () => ({}),
          SetSourceFilterSettings: () => ({}),
          SetSourceFilterEnabled: () => ({}),
        }),
      });

      await result;

      const createFilterCall = calls.find(
        (c) => c.requestType === "CreateSourceFilter"
      );
      expect(createFilterCall).toBeDefined();
      expect(createFilterCall?.requestData).toMatchObject({
        sourceName: "Chat",
        filterName: "Color Fix",
        filterKind: "color_filter_v2",
        filterSettings: { gamma: 1.5 },
      });
    });

    it("should set filter enabled state during creation", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            settings: { gamma: 1.5 },
            enabled: false,
          },
        },
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { result, calls } = runEffect(Scene.sync(declaration), {
        handlers: freshSceneHandlers({
          CreateSourceFilter: () => ({}),
          SetSourceFilterSettings: () => ({}),
          SetSourceFilterEnabled: () => ({}),
        }),
      });

      await result;

      const enabledCall = calls.find(
        (c) => c.requestType === "SetSourceFilterEnabled"
      );
      expect(enabledCall).toBeDefined();
      expect(enabledCall?.requestData).toMatchObject({
        sourceName: "Chat",
        filterName: "Color Fix",
        filterEnabled: false,
      });
    });

    it("should provide filter access via scene.item().input.filter()", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            settings: { gamma: 1.5 },
          },
        },
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { result } = runEffect(Scene.sync(declaration), {
        handlers: freshSceneHandlers({
          CreateSourceFilter: () => ({}),
          SetSourceFilterSettings: () => ({}),
          SetSourceFilterEnabled: () => ({}),
        }),
      });

      const scene = await result;
      const filterRuntime = scene.item("chat").input.filter("colorFix");
      expect(filterRuntime).toBeDefined();
      expect(filterRuntime.name).toBe("Color Fix");
      expect(filterRuntime.sourceName).toBe("Chat");
    });
  });

  describe("reconciliation edge cases", () => {
    it("should apply settings to already-existing inputs", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
        settings: { url: "https://twitch.tv/chat", width: 1920 },
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      // Input already registered + already in the scene
      const effect = Effect.gen(function* () {
        const sceneify = yield* Sceneify;
        yield* sceneify.registerInput({ name: "Chat" });
        return yield* Scene.sync(declaration);
      });

      const { result, calls } = runEffect(effect, {
        handlers: freshSceneHandlers({
          GetSceneItemList: () => ({
            sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
          }),
          SetInputSettings: () => ({}),
        }),
      });

      await result;

      const setSettingsCall = calls.find(
        (c) => c.requestType === "SetInputSettings"
      );
      expect(setSettingsCall).toBeDefined();
      expect(setSettingsCall?.requestData).toMatchObject({
        inputName: "Chat",
        inputSettings: { url: "https://twitch.tv/chat", width: 1920 },
      });
    });

    it("should deduplicate inputs across multiple scene creations", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const scene1 = Scene.declare({
        name: "Scene 1",
        items: {
          chat: { source: chatInput },
        },
      });

      const scene2 = Scene.declare({
        name: "Scene 2",
        items: {
          chat: { source: chatInput },
        },
      });

      const effect = Effect.gen(function* () {
        yield* Scene.sync(scene1);
        yield* Scene.sync(scene2);
      });

      const { result, calls } = runEffect(effect, {
        handlers: freshSceneHandlers({
          CreateSceneItem: () => ({ sceneItemId: 99 }),
        }),
      });

      await result;

      // Input should only be created once via CreateInput
      const createInputCalls = calls.filter(
        (c) => c.requestType === "CreateInput"
      );
      expect(createInputCalls).toHaveLength(1);

      // The second scene should add an existing input to the scene
      const createSceneItemCalls = calls.filter(
        (c) => c.requestType === "CreateSceneItem"
      );
      expect(createSceneItemCalls).toHaveLength(1);
      expect(createSceneItemCalls[0]?.requestData).toMatchObject({
        sceneName: "Scene 2",
        sourceName: "Chat",
      });
    });

    it("should update existing scene items with new transform/enabled/lock", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: {
            source: chatInput,
            transform: { positionX: 500, positionY: 600 },
            enabled: false,
            lock: true,
          },
        },
      });

      // Input already exists and is already in the scene
      const effect = Effect.gen(function* () {
        const sceneify = yield* Sceneify;
        yield* sceneify.registerInput({ name: "Chat" });
        return yield* Scene.sync(declaration);
      });

      const { result, calls } = runEffect(effect, {
        handlers: freshSceneHandlers({
          GetSceneItemList: () => ({
            sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
          }),
          SetInputSettings: () => ({}),
        }),
      });

      await result;

      const transformCall = calls.find(
        (c) => c.requestType === "SetSceneItemTransform"
      );
      expect(transformCall?.requestData).toMatchObject({
        sceneItemTransform: { positionX: 500, positionY: 600 },
        sceneItemId: 10,
      });

      const enabledCall = calls.find(
        (c) => c.requestType === "SetSceneItemEnabled"
      );
      expect(enabledCall?.requestData).toMatchObject({
        sceneItemEnabled: false,
        sceneItemId: 10,
      });

      const lockedCall = calls.find(
        (c) => c.requestType === "SetSceneItemLocked"
      );
      expect(lockedCall?.requestData).toMatchObject({
        sceneItemLocked: true,
        sceneItemId: 10,
      });
    });
  });

  describe("dynamic scene operations", () => {
    it("should dynamically create a new scene item via scene.createItem()", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { result, calls } = runEffect(
        Effect.gen(function* () {
          const scene = yield* Scene.sync(declaration);

          // Dynamically add a new item
          const newItem = yield* scene.createItem({
            type: BrowserSource,
            name: "Overlay",
            settings: { url: "https://overlay.com" },
          });
          return newItem;
        }),
        {
          handlers: freshSceneHandlers({
            CreateSceneItem: () => ({ sceneItemId: 77 }),
          }),
        }
      );

      const newItem = await result;
      expect(newItem.id).toBe(77);
      expect(newItem.input.name).toBe("Overlay");
      expect(newItem.declared).toBe(false);
    });

    it("should allow removing dynamically created items", async () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { result, calls } = runEffect(
        Effect.gen(function* () {
          const scene = yield* Scene.sync(declaration);
          const newItem = yield* scene.createItem({
            type: BrowserSource,
            name: "Overlay",
          });
          yield* newItem.remove();
        }),
        {
          handlers: freshSceneHandlers({
            CreateSceneItem: () => ({ sceneItemId: 77 }),
            RemoveSceneItem: () => ({}),
          }),
        }
      );

      await result;

      const removeCall = calls.find(
        (c) =>
          c.requestType === "RemoveSceneItem" &&
          c.requestData?.sceneItemId === 77
      );
      expect(removeCall).toBeDefined();
    });
  });
});
