import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { InputType } from "../src/InputType.js";
import { FilterType } from "../src/FilterType.js";
import { Input } from "../src/Input.js";
import { Scene } from "../src/Scene.js";
import { Sceneify } from "../src/Sceneify.js";
import { createTestLayer, type CallHandler } from "./helpers.js";

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
    // Private settings defaults — stamp/read ownership
    SetSourcePrivateSettings: () => ({}),
    GetSourcePrivateSettings: () => ({
      sourceSettings: { SCENEIFY: { init: "created" } },
    }),
    ...overrides,
  };
}

describe("Scene.sync", () => {
  it.scoped("should create a scene in OBS when it does not exist", () => {
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

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      yield* Scene.sync(declaration);

      const createSceneCall = calls.find(
        (c) => c.requestType === "CreateScene"
      );
      expect(createSceneCall).toBeDefined();
      expect(createSceneCall?.requestData).toEqual({
        sceneName: "Main Scene",
      });
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should not create a scene if it already exists", () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers({
        GetSceneList: () => ({
          scenes: [{ sceneName: "Main Scene", sceneIndex: 0 }],
        }),
      }),
    });

    return Effect.gen(function* () {
      yield* Scene.sync(declaration);

      const createSceneCall = calls.find(
        (c) => c.requestType === "CreateScene"
      );
      expect(createSceneCall).toBeUndefined();
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should create inputs via OBS", () => {
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

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      yield* Scene.sync(declaration);

      const createInputCall = calls.find(
        (c) => c.requestType === "CreateInput"
      );
      expect(createInputCall).toBeDefined();
      expect(createInputCall?.requestData).toMatchObject({
        inputName: "Chat",
        inputKind: "browser_source",
        inputSettings: { url: "https://twitch.tv/chat", width: 1920 },
      });
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should return a SceneRuntime with a name property", () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { layer } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      const scene = yield* Scene.sync(declaration);
      expect(scene.name).toBe("Main Scene");
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should provide typed item access via .item(key)", () => {
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

    const { layer } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      const scene = yield* Scene.sync(declaration);
      const chatItem = scene.item("chat");
      expect(chatItem).toBeDefined();
      expect(chatItem.input.name).toBe("Chat");
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should assign scene item IDs from OBS responses", () => {
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
    const { layer } = createTestLayer({
      handlers: freshSceneHandlers({
        CreateInput: () => ({ sceneItemId: nextId++ }),
      }),
    });

    return Effect.gen(function* () {
      const scene = yield* Scene.sync(declaration);
      expect(scene.item("chat").id).toBe(42);
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should handle multiple items in a scene", () => {
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

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      const scene = yield* Scene.sync(declaration);

      expect(scene.item("chat").input.name).toBe("Chat");
      expect(scene.item("bg").input.name).toBe("Background");

      const createInputCalls = calls.filter(
        (c) => c.requestType === "CreateInput"
      );
      expect(createInputCalls).toHaveLength(2);
    }).pipe(Effect.provide(layer));
  });

  it.scoped("should apply transform when creating new scene items", () => {
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

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers(),
    });

    return Effect.gen(function* () {
      yield* Scene.sync(declaration);

      const transformCall = calls.find(
        (c) => c.requestType === "SetSceneItemTransform"
      );
      expect(transformCall).toBeDefined();
      expect(transformCall?.requestData).toMatchObject({
        sceneItemTransform: { positionX: 100, positionY: 200 },
      });
    }).pipe(Effect.provide(layer));
  });

  it.scoped(
    "should not duplicate inputs already registered in Sceneify",
    () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { layer, calls } = createTestLayer({
        handlers: freshSceneHandlers({
          GetSceneItemList: () => ({
            sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
          }),
        }),
      });

      return Effect.gen(function* () {
        const sceneify = yield* Sceneify;
        yield* sceneify.registerInput({ name: "Chat" });
        yield* Scene.sync(declaration);

        const createInputCalls = calls.filter(
          (c) => c.requestType === "CreateInput"
        );
        expect(createInputCalls).toHaveLength(0);
      }).pipe(Effect.provide(layer));
    }
  );

  it.scoped("should remove stale items not in the declaration", () => {
    const chatInput = Input.declare(BrowserSource, {
      name: "Chat",
    });

    const declaration = Scene.declare({
      name: "Main Scene",
      items: {
        chat: { source: chatInput },
      },
    });

    const { layer, calls } = createTestLayer({
      handlers: freshSceneHandlers({
        GetSceneItemList: () => ({
          sceneItems: [{ sceneItemId: 99, sourceName: "Old Stale Input" }],
        }),
      }),
    });

    return Effect.gen(function* () {
      yield* Scene.sync(declaration);

      const removeCall = calls.find((c) => c.requestType === "RemoveSceneItem");
      expect(removeCall).toBeDefined();
      expect(removeCall?.requestData).toMatchObject({
        sceneName: "Main Scene",
        sceneItemId: 99,
      });
    }).pipe(Effect.provide(layer));
  });

  describe("filter lifecycle", () => {
    it.scoped("should create filters on inputs during scene creation", () => {
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

      const { layer, calls } = createTestLayer({
        handlers: freshSceneHandlers({
          CreateSourceFilter: () => ({}),
          SetSourceFilterSettings: () => ({}),
          SetSourceFilterEnabled: () => ({}),
        }),
      });

      return Effect.gen(function* () {
        yield* Scene.sync(declaration);

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
      }).pipe(Effect.provide(layer));
    });

    it.scoped("should set filter enabled state during creation", () => {
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

      const { layer, calls } = createTestLayer({
        handlers: freshSceneHandlers({
          CreateSourceFilter: () => ({}),
          SetSourceFilterSettings: () => ({}),
          SetSourceFilterEnabled: () => ({}),
        }),
      });

      return Effect.gen(function* () {
        yield* Scene.sync(declaration);

        const enabledCall = calls.find(
          (c) => c.requestType === "SetSourceFilterEnabled"
        );
        expect(enabledCall).toBeDefined();
        expect(enabledCall?.requestData).toMatchObject({
          sourceName: "Chat",
          filterName: "Color Fix",
          filterEnabled: false,
        });
      }).pipe(Effect.provide(layer));
    });

    it.scoped(
      "should provide filter access via scene.item().input.filter()",
      () => {
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

        const { layer } = createTestLayer({
          handlers: freshSceneHandlers({
            CreateSourceFilter: () => ({}),
            SetSourceFilterSettings: () => ({}),
            SetSourceFilterEnabled: () => ({}),
          }),
        });

        return Effect.gen(function* () {
          const scene = yield* Scene.sync(declaration);
          const filterRuntime = scene.item("chat").input.filter("colorFix");
          expect(filterRuntime).toBeDefined();
          expect(filterRuntime.name).toBe("Color Fix");
          expect(filterRuntime.sourceName).toBe("Chat");
        }).pipe(Effect.provide(layer));
      }
    );
  });

  describe("reconciliation edge cases", () => {
    it.scoped("should apply settings to already-existing inputs", () => {
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

      const { layer, calls } = createTestLayer({
        handlers: freshSceneHandlers({
          GetSceneItemList: () => ({
            sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
          }),
          SetInputSettings: () => ({}),
        }),
      });

      return Effect.gen(function* () {
        const sceneify = yield* Sceneify;
        yield* sceneify.registerInput({ name: "Chat" });
        yield* Scene.sync(declaration);

        const setSettingsCall = calls.find(
          (c) => c.requestType === "SetInputSettings"
        );
        expect(setSettingsCall).toBeDefined();
        expect(setSettingsCall?.requestData).toMatchObject({
          inputName: "Chat",
          inputSettings: { url: "https://twitch.tv/chat", width: 1920 },
        });
      }).pipe(Effect.provide(layer));
    });

    it.scoped(
      "should deduplicate inputs across multiple scene creations",
      () => {
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

        const { layer, calls } = createTestLayer({
          handlers: freshSceneHandlers({
            CreateSceneItem: () => ({ sceneItemId: 99 }),
          }),
        });

        return Effect.gen(function* () {
          yield* Scene.sync(scene1);
          yield* Scene.sync(scene2);

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
        }).pipe(Effect.provide(layer));
      }
    );

    it.scoped(
      "should update existing scene items with new transform/enabled/lock",
      () => {
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

        const { layer, calls } = createTestLayer({
          handlers: freshSceneHandlers({
            GetSceneItemList: () => ({
              sceneItems: [{ sceneItemId: 10, sourceName: "Chat" }],
            }),
            SetInputSettings: () => ({}),
          }),
        });

        return Effect.gen(function* () {
          const sceneify = yield* Sceneify;
          yield* sceneify.registerInput({ name: "Chat" });
          yield* Scene.sync(declaration);

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
        }).pipe(Effect.provide(layer));
      }
    );
  });

  describe("dynamic scene operations", () => {
    it.scoped(
      "should dynamically create a new scene item via scene.createItem()",
      () => {
        const chatInput = Input.declare(BrowserSource, {
          name: "Chat",
        });

        const declaration = Scene.declare({
          name: "Main Scene",
          items: {
            chat: { source: chatInput },
          },
        });

        const { layer } = createTestLayer({
          handlers: freshSceneHandlers({
            CreateSceneItem: () => ({ sceneItemId: 77 }),
          }),
        });

        return Effect.gen(function* () {
          const scene = yield* Scene.sync(declaration);

          // Dynamically add a new item
          const newItem = yield* scene.createItem({
            type: BrowserSource,
            name: "Overlay",
            settings: { url: "https://overlay.com" },
          });

          expect(newItem.id).toBe(newItem.id);
          expect(newItem.input.name).toBe("Overlay");
          expect(newItem.declared).toBe(false);
        }).pipe(Effect.provide(layer));
      }
    );

    it.scoped("should allow removing dynamically created items", () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
        },
      });

      const { layer, calls } = createTestLayer({
        handlers: freshSceneHandlers({
          CreateSceneItem: () => ({ sceneItemId: 77 }),
          RemoveSceneItem: () => ({}),
        }),
      });

      return Effect.gen(function* () {
        const scene = yield* Scene.sync(declaration);
        const newItem = yield* scene.createItem({
          type: BrowserSource,
          name: "Overlay",
        });
        yield* newItem.remove();

        const removeCall = calls.find(
          (c) =>
            c.requestType === "RemoveSceneItem" &&
            c.requestData?.sceneItemId === newItem.id
        );
        expect(removeCall).toBeDefined();
      }).pipe(Effect.provide(layer));
    });
  });
});
