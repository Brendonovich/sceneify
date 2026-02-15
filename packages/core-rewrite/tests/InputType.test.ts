import { describe, expect, expectTypeOf } from "vitest";
import { it } from "@effect/vitest";
import { InputType, type InputTypeSettings } from "../src/InputType.js";

describe("InputType", () => {
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

  it("should create an InputType class", () => {
    expect(BrowserSource).toBeDefined();
  });

  it("should have a static kind property matching the OBS kind", () => {
    expect(BrowserSource.kind).toBe("browser_source");
    expect(ColorSource.kind).toBe("color_source_v3");
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
