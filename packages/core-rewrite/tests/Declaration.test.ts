import { describe, it, expect, expectTypeOf } from "vitest";
import { InputType, type InputTypeSettings } from "../src/InputType.js";
import { FilterType, type FilterTypeSettings } from "../src/FilterType.js";
import * as Input from "../src/Input.js";
import * as Scene from "../src/Scene.js";

describe("Declaration APIs", () => {
  class BrowserSource extends InputType("browser_source")<{
    url: string;
    width: number;
    height: number;
  }> {}

  class ColorCorrection extends FilterType("color_filter_v2")<{
    gamma: number;
    contrast: number;
    brightness: number;
  }> {}

  describe("Input.declare", () => {
    it("should create an input declaration", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        settings: {
          url: "https://twitch.tv/chat",
          width: 1920,
        },
      });

      expect(declaration.name).toBe("Chat");
      expect(declaration.type).toBe(BrowserSource);
      expect(declaration.settings).toEqual({
        url: "https://twitch.tv/chat",
        width: 1920,
      });
    });

    it("should default to empty settings", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
      });

      expect(declaration.settings).toEqual({});
    });

    it("should allow inline filters", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            settings: { gamma: 1.5 },
          },
        },
      });

      expect(declaration.filters).toBeDefined();
      expect(declaration.filters.colorFix.name).toBe("Color Fix");
      expect(declaration.filters.colorFix.type).toBe(ColorCorrection);
      expect(declaration.filters.colorFix.settings).toEqual({ gamma: 1.5 });
    });

    it("should default filter enabled to undefined (treated as true)", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
          },
        },
      });

      expect("enabled" in declaration.filters.colorFix).toBe(false);
    });

    it("should allow setting filter enabled to false", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            enabled: false,
          },
        },
      });

      expect(declaration.filters.colorFix.enabled).toBe(false);
    });

    it("should type-check settings against InputType", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        settings: {
          url: "https://twitch.tv/chat",
          width: 1920,
        },
      });

      type DeclSettings = typeof declaration.settings;
      expectTypeOf<DeclSettings>().toMatchTypeOf<
        Partial<InputTypeSettings<typeof BrowserSource>>
      >();
    });

    it("should type-check filter settings against FilterType", () => {
      const declaration = Input.declare(BrowserSource, {
        name: "Chat",
        filters: {
          colorFix: {
            type: ColorCorrection,
            name: "Color Fix",
            settings: { gamma: 1.5 },
          },
        },
      });

      type FilterSettings = NonNullable<
        typeof declaration.filters.colorFix.settings
      >;
      expectTypeOf<FilterSettings>().toMatchTypeOf<
        Partial<FilterTypeSettings<typeof ColorCorrection>>
      >();
    });
  });

  describe("Scene.declare", () => {
    it("should create a scene declaration", () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
        settings: { url: "https://twitch.tv/chat" },
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: {
            source: chatInput,
            enabled: true,
            transform: {
              positionX: 100,
              positionY: 200,
            },
          },
        },
      });

      expect(declaration.name).toBe("Main Scene");
      expect(declaration.items.chat.source).toBe(chatInput);
      expect(declaration.items.chat.enabled).toBe(true);
      expect(declaration.items.chat.transform).toEqual({
        positionX: 100,
        positionY: 200,
      });
    });

    it("should allow multiple items", () => {
      const chatInput = Input.declare(BrowserSource, {
        name: "Chat",
      });

      const gameInput = Input.declare(BrowserSource, {
        name: "Game",
      });

      const declaration = Scene.declare({
        name: "Main Scene",
        items: {
          chat: { source: chatInput },
          game: { source: gameInput },
        },
      });

      expect(Object.keys(declaration.items)).toEqual(["chat", "game"]);
    });
  });
});
