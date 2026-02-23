import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { CodeGenerator } from "../src/CodeGenerator.ts";
import { TypeRegistry } from "../src/TypeRegistry.ts";
import type { OBSData } from "../src/OBSFetcher.ts";

describe("CodeGenerator", () => {
  const mockData: OBSData = {
    inputs: [
      {
        name: "Chat Browser",
        kind: "browser_source",
        settings: {
          url: "https://example.com/chat",
          width: 400,
          height: 600,
        },
        filters: [],
      },
      {
        name: "Background",
        kind: "color_source_v3",
        settings: {
          color: 0xff2d2d3a,
          width: 1920,
          height: 1080,
        },
        filters: [],
      },
    ],
    scenes: [
      {
        name: "Main Scene",
        items: [
          {
            sceneItemId: 1,
            sourceName: "Background",
            sourceKind: "color_source_v3",
            sceneItemEnabled: true,
            sceneItemLocked: false,
            sceneItemIndex: 0,
            transform: {
              positionX: 0,
              positionY: 0,
            },
          },
          {
            sceneItemId: 2,
            sourceName: "Chat Browser",
            sourceKind: "browser_source",
            sceneItemEnabled: true,
            sceneItemLocked: false,
            sceneItemIndex: 1,
            transform: {
              positionX: 100,
              positionY: 100,
              scaleX: 0.5,
              scaleY: 0.5,
            },
          },
        ],
      },
    ],
  };

  it.effect("should generate valid TypeScript code", () =>
    Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(mockData);

      // Basic validation
      expect(code).toContain("import");
      expect(code).toContain("Input.declare");
      expect(code).toContain("Scene.declare");
      expect(code).toContain("export {");
    })
  );

  it.effect("should generate unique variable names", () =>
    Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(mockData);

      // Should contain the input declarations with camelCase names
      expect(code).toContain("const chatBrowser = Input.declare");
      expect(code).toContain("const background = Input.declare");
      expect(code).toContain("const mainScene = Scene.declare");
    })
  );

  it.effect("should include correct imports from @sceneify/sources", () =>
    Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(mockData);

      expect(code).toContain("BrowserSource");
      expect(code).toContain("ColorSource");
      expect(code).toContain('from "@sceneify/sources"');
    })
  );

  it.effect("should format settings correctly", () =>
    Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(mockData);

      // Check that settings are properly formatted
      expect(code).toContain('url: "https://example.com/chat"');
      expect(code).toContain("width: 400");
      expect(code).toContain("height: 600");
    })
  );

  it.effect("should handle transforms correctly", () =>
    Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(mockData);

      expect(code).toContain("transform:");
      expect(code).toContain("positionX: 100");
      expect(code).toContain("scaleX: 0.5");
    })
  );

  it.effect("should handle filters", () => {
    const dataWithFilters: OBSData = {
      inputs: [
        {
          name: "Webcam",
          kind: "image_source",
          settings: { file: "/path/to/webcam.png" },
          filters: [
            {
              name: "Color Correction",
              kind: "color_filter_v2",
              settings: { brightness: 1.1, contrast: 1.2 },
              enabled: true,
            },
          ],
        },
      ],
      scenes: [],
    };

    return Effect.gen(function* () {
      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry);
      const code = yield* generator.generate(dataWithFilters);

      expect(code).toContain("ColorCorrectionFilter");
      expect(code).toContain("filters:");
      expect(code).toContain("colorCorrection:");
    });
  });

  it.effect("should fail for unknown types when not allowed", () =>
    Effect.gen(function* () {
      const dataWithUnknown: OBSData = {
        inputs: [
          {
            name: "Unknown Input",
            kind: "custom_unknown_kind",
            settings: {},
            filters: [],
          },
        ],
        scenes: [],
      };

      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry, { allowInlineDefinitions: false });

      const result = yield* Effect.either(generator.generate(dataWithUnknown));

      expect(result._tag).toBe("Left");
    })
  );

  it.effect("should generate inline definitions for unknown types when allowed", () =>
    Effect.gen(function* () {
      const dataWithUnknown: OBSData = {
        inputs: [
          {
            name: "Unknown Input",
            kind: "custom_unknown_kind",
            settings: { custom_prop: "value" },
            filters: [],
          },
        ],
        scenes: [],
      };

      const registry = new TypeRegistry();
      const generator = new CodeGenerator(registry, { allowInlineDefinitions: true });
      const code = yield* generator.generate(dataWithUnknown);

      expect(code).toContain("class CustomUnknownKindInput extends InputType");
      expect(code).toContain('"custom_unknown_kind"');
    })
  );
});

describe("TypeRegistry", () => {
  it("should map known input kinds correctly", () => {
    const registry = new TypeRegistry();
    
    expect(registry.getInputTypeName("browser_source")).toBe("BrowserSource");
    expect(registry.getInputTypeName("color_source_v3")).toBe("ColorSource");
    expect(registry.getInputTypeName("image_source")).toBe("ImageSource");
  });

  it("should map known filter kinds correctly", () => {
    const registry = new TypeRegistry();
    
    expect(registry.getFilterTypeName("chroma_key_filter_v2")).toBe("ChromaKeyFilter");
    expect(registry.getFilterTypeName("color_filter_v2")).toBe("ColorCorrectionFilter");
    expect(registry.getFilterTypeName("gain_filter")).toBe("GainFilter");
  });

  it("should return undefined for unknown kinds", () => {
    const registry = new TypeRegistry();
    
    expect(registry.getInputTypeName("unknown_kind")).toBeUndefined();
    expect(registry.getFilterTypeName("unknown_filter")).toBeUndefined();
  });

  it("should track used types", () => {
    const registry = new TypeRegistry();
    
    registry.markInputTypeUsed("browser_source");
    registry.markFilterTypeUsed("chroma_key_filter_v2");
    
    expect(registry.getUsedInputTypes()).toContain("BrowserSource");
    expect(registry.getUsedFilterTypes()).toContain("ChromaKeyFilter");
  });
});
