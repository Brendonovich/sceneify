import { describe, expect, expectTypeOf } from "vitest";
import { it } from "@effect/vitest";
import { FilterType, type FilterTypeSettings } from "../src/FilterType.js";

describe("FilterType", () => {
  class ColorCorrection extends FilterType("color_filter_v2")<{
    gamma: number;
    contrast: number;
    brightness: number;
  }>() {}

  class GainFilter extends FilterType("gain_filter")<{
    db: number;
  }>() {}

  it("should create a FilterType class", () => {
    expect(ColorCorrection).toBeDefined();
  });

  it("should have a static kind property matching the OBS kind", () => {
    expect(ColorCorrection.kind).toBe("color_filter_v2");
    expect(GainFilter.kind).toBe("gain_filter");
  });

  it("should expose settings type through FilterTypeSettings helper", () => {
    type CCSettings = FilterTypeSettings<typeof ColorCorrection>;
    expectTypeOf<CCSettings>().toEqualTypeOf<{
      gamma: number;
      contrast: number;
      brightness: number;
    }>();

    type GainSettings = FilterTypeSettings<typeof GainFilter>;
    expectTypeOf<GainSettings>().toEqualTypeOf<{
      db: number;
    }>();
  });
});
