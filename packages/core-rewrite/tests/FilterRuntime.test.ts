import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { FilterType } from "../src/FilterType.js";
import { createMockOBSSocket, type CallHandler } from "./helpers.js";
import { Filter } from "../src/Filter.js";

class ColorCorrection extends FilterType("color_filter_v2")<{
  gamma: number;
  contrast: number;
  brightness: number;
}>() {}

const createTestFilter = Effect.fn(function* (
  handlers: Record<string, CallHandler> = {}
) {
  const mock = createMockOBSSocket({ handlers });
  const filter = yield* Filter.make<typeof ColorCorrection>(
    "Color Fix",
    "Chat Browser"
  ).pipe(Effect.provide(mock.layer));
  return { filter, calls: mock.calls };
});

describe("Filter", () => {
  describe("getSettings", () => {
    it("should get filter settings from OBS", () =>
      Effect.gen(function* () {
        const { filter } = yield* createTestFilter({
          GetSourceFilter: () => ({
            filterSettings: { gamma: 1.5, contrast: 1.2, brightness: 0.8 },
            filterEnabled: true,
            filterIndex: 0,
            filterKind: "color_filter_v2",
          }),
        });

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
        const { filter, calls } = yield* createTestFilter({
          SetSourceFilterSettings: () => ({}),
        });

        yield* filter.setSettings({ gamma: 2.0 });

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterSettings",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterSettings: { gamma: 2.0 },
          },
        });
      }));
  });

  describe("setEnabled", () => {
    it("should enable/disable a filter", () =>
      Effect.gen(function* () {
        const { filter, calls } = yield* createTestFilter({
          SetSourceFilterEnabled: () => ({}),
        });

        filter.setEnabled(false);

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterEnabled",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterEnabled: false,
          },
        });
      }));
  });

  describe("setIndex", () => {
    it("should set filter index/order", () =>
      Effect.gen(function* () {
        const { filter, calls } = yield* createTestFilter({
          SetSourceFilterIndex: () => ({}),
        });

        yield* filter.setIndex(2);

        expect(calls).toContainEqual({
          requestType: "SetSourceFilterIndex",
          requestData: {
            sourceName: "Chat Browser",
            filterName: "Color Fix",
            filterIndex: 2,
          },
        });
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
