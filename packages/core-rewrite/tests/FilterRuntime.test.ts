import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { FilterType } from "../src/FilterType.js";
import { createFilter } from "../src/FilterRuntime.js";
import { createMockOBSSocket, type CallHandler } from "./helpers.js";

class ColorCorrection extends FilterType("color_filter_v2")<{
  gamma: number;
  contrast: number;
  brightness: number;
}> {}

function createTestFilter(handlers: Record<string, CallHandler> = {}) {
  const mock = createMockOBSSocket({ handlers });
  const filter = createFilter<typeof ColorCorrection>(
    mock.service,
    "Color Fix",
    "Chat Browser"
  );
  return { filter, calls: mock.calls };
}

describe("Filter", () => {
  describe("getSettings", () => {
    it("should get filter settings from OBS", async () => {
      const { filter } = createTestFilter({
        GetSourceFilter: () => ({
          filterSettings: { gamma: 1.5, contrast: 1.2, brightness: 0.8 },
          filterEnabled: true,
          filterIndex: 0,
          filterKind: "color_filter_v2",
        }),
      });

      expect(await Effect.runPromise(filter.getSettings())).toEqual({
        gamma: 1.5,
        contrast: 1.2,
        brightness: 0.8,
      });
    });
  });

  describe("setSettings", () => {
    it("should set filter settings on OBS", async () => {
      const { filter, calls } = createTestFilter({
        SetSourceFilterSettings: () => ({}),
      });

      await Effect.runPromise(filter.setSettings({ gamma: 2.0 }));

      expect(calls).toContainEqual({
        requestType: "SetSourceFilterSettings",
        requestData: {
          sourceName: "Chat Browser",
          filterName: "Color Fix",
          filterSettings: { gamma: 2.0 },
        },
      });
    });
  });

  describe("setEnabled", () => {
    it("should enable/disable a filter", async () => {
      const { filter, calls } = createTestFilter({
        SetSourceFilterEnabled: () => ({}),
      });

      await Effect.runPromise(filter.setEnabled(false));

      expect(calls).toContainEqual({
        requestType: "SetSourceFilterEnabled",
        requestData: {
          sourceName: "Chat Browser",
          filterName: "Color Fix",
          filterEnabled: false,
        },
      });
    });
  });

  describe("setIndex", () => {
    it("should set filter index/order", async () => {
      const { filter, calls } = createTestFilter({
        SetSourceFilterIndex: () => ({}),
      });

      await Effect.runPromise(filter.setIndex(2));

      expect(calls).toContainEqual({
        requestType: "SetSourceFilterIndex",
        requestData: {
          sourceName: "Chat Browser",
          filterName: "Color Fix",
          filterIndex: 2,
        },
      });
    });
  });

  describe("name and sourceName", () => {
    it("should expose name and sourceName", () => {
      const mock = createMockOBSSocket();
      const filter = createFilter<typeof ColorCorrection>(
        mock.service,
        "Color Fix",
        "Chat Browser"
      );

      expect(filter.name).toBe("Color Fix");
      expect(filter.sourceName).toBe("Chat Browser");
    });
  });
});
