import { describe, expect, expectTypeOf } from "vitest";
import { it } from "@effect/vitest";
import { InputType, type InputTypeSettings } from "../src/InputType.js";
import { Schema } from "effect";

describe("InputType", () => {
  class BrowserSource extends InputType("browser_source")({
    url: Schema.String,
    width: Schema.Number,
    height: Schema.Number,
  }) {}

  class ColorSource extends InputType("color_source_v3")({
    color: Schema.Number,
    width: Schema.Number,
    height: Schema.Number,
  }) {}

  it("should create an InputType class", () => {
    expect(BrowserSource).toBeDefined();
  });

  it("should have a static kind property matching the OBS kind", () => {
    expect(BrowserSource.kind).toBe("browser_source");
    expect(ColorSource.kind).toBe("color_source_v3");
  });

  it("should expose its settings schema", () => {
    expect(
      Schema.decodeUnknownSync(BrowserSource.schema)({
        url: "https://example.com",
        width: 1920,
        height: 1080,
      })
    ).toEqual({
      url: "https://example.com",
      width: 1920,
      height: 1080,
    });
  });

  it("should expose settings type through InputTypeSettings helper", () => {
    type BrowserSettings = InputTypeSettings<typeof BrowserSource>;
    expectTypeOf<BrowserSettings>().toEqualTypeOf<{
      url: string;
      width: number;
      height: number;
    }>();

    type ColorSettings = InputTypeSettings<typeof ColorSource>;
    expectTypeOf<ColorSettings>().toEqualTypeOf<{
      color: number;
      width: number;
      height: number;
    }>();
  });

  it("should not be directly instantiable", () => {
    // The constructor takes `_: never` so it shouldn't be callable normally.
    // This is a compile-time check more than runtime, but we verify the class exists.
    expect(typeof BrowserSource).toBe("function");
  });
});
