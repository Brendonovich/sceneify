import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FilterType } from "../src/FilterType.js";
import { MockOBSSocket } from "../src/index.js";
import { createMockOBSSocket } from "./helpers.js";
import { Filter } from "../src/Filter.js";

class ColorCorrection extends FilterType("color_filter_v2")({
  gamma: Schema.Number,
  contrast: Schema.Number,
  brightness: Schema.Number,
}) {}

const createTestFilter = Effect.fn(function* (
  options: MockOBSSocket.Options = {}
) {
  const mock = createMockOBSSocket({
    inputs: [
      {
        name: "Chat Browser",
        kind: "browser_source",
        filters: [
          {
            name: "Color Fix",
            kind: "color_filter_v2",
            settings: { gamma: 1.5, contrast: 1.2, brightness: 0.8 },
          },
          { name: "Sharpen", kind: "sharpness_filter_v2" },
          { name: "Mask", kind: "mask_filter_v2" },
        ],
      },
    ],
    ...options,
  });
  const filter = yield* Filter.make<typeof ColorCorrection>(
    "Color Fix",
    "Chat Browser"
  ).pipe(Effect.provide(mock.layer));
  return { filter, calls: mock.calls, snapshot: mock.snapshot };
});

describe("Filter", () => {
  describe("getSettings", () => {
    it("should get filter settings from OBS", () =>
      Effect.gen(function* () {
        const { filter } = yield* createTestFilter();

        expect(yield* filter.getSettings()).toEqual({
          gamma: 1.5,
          contrast: 1.2,
          brightness: 0.8,
        });
      }));
  });

  describe("setSettings", () => {
    it("should set filter settings on OBS", () =>
      Effect.gen(function* () {
        const { filter, calls, snapshot } = yield* createTestFilter();

        yield* filter.setSettings({ gamma: 2.0 });

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterSettings",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterSettings: { gamma: 2.0 },
          },
        });
        expect(snapshot().inputs[0]?.filters[0]?.settings).toEqual({
          gamma: 2,
          contrast: 1.2,
          brightness: 0.8,
        });
      }));
  });

  describe("setEnabled", () => {
    it("should enable/disable a filter", () =>
      Effect.gen(function* () {
        const { filter, calls, snapshot } = yield* createTestFilter();

        yield* filter.setEnabled(false);

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterEnabled",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterEnabled: false,
          },
        });
        expect(snapshot().inputs[0]?.filters[0]?.enabled).toBe(false);
      }));
  });

  describe("setIndex", () => {
    it("should set filter index/order", () =>
      Effect.gen(function* () {
        const { filter, calls, snapshot } = yield* createTestFilter();

        yield* filter.setIndex(2);

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterIndex",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterIndex: 2,
          },
        });
        expect(snapshot().inputs[0]?.filters.map(({ name }) => name)).toEqual([
          "Sharpen",
          "Mask",
          "Color Fix",
        ]);
      }));
  });

  describe("name and sourceName", () => {
    it("should expose name and sourceName", () =>
      Effect.gen(function* () {
        const mock = createMockOBSSocket();
        const filter = yield* Filter.make<typeof ColorCorrection>(
          "Color Fix",
          "Chat Browser"
        ).pipe(Effect.provide(mock.layer));

        expect(filter.name).toBe("Color Fix");
        expect(filter.sourceName).toBe("Chat Browser");
      }));
  });
});
