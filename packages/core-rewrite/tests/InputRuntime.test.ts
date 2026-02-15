import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import { InputType } from "../src/InputType.js";
import { Input } from "../src/Input.js";
import { createMockOBSSocket, type CallHandler } from "./helpers.js";

class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
}>() {}

const createTestInput = Effect.fnUntraced(function* (
  handlers: Record<string, CallHandler> = {}
) {
  const mock = createMockOBSSocket({ handlers });
  const input = yield* Input.make<typeof BrowserSource>(
    "Chat",
    "browser_source"
  ).pipe(Effect.provide(mock.layer));
  return { input, calls: mock.calls };
});

describe("Input", () => {
  describe("setSettings", () => {
    it("should call SetInputSettings with the input name and settings", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputSettings: () => ({}),
        });

        yield* input.setSettings({ url: "https://example.com", width: 1920 });

        expect(calls).toContainEqual({
          requestType: "SetInputSettings",
          requestData: {
            inputName: "Chat",
            inputSettings: { url: "https://example.com", width: 1920 },
          },
        });
      }));

    it("should support partial settings", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputSettings: () => ({}),
        });

        yield* input.setSettings({ url: "https://new-url.com" });

        expect(calls[0]?.requestData).toEqual({
          inputName: "Chat",
          inputSettings: { url: "https://new-url.com" },
        });
      }));
  });

  describe("getSettings", () => {
    it("should call GetInputSettings and return the settings", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          GetInputSettings: () => ({
            inputSettings: {
              url: "https://example.com",
              width: 1920,
              height: 1080,
            },
            inputKind: "browser_source",
          }),
        });

        const settings = yield* input.getSettings();
        expect(settings).toEqual({
          url: "https://example.com",
          width: 1920,
          height: 1080,
        });
      }));
  });

  describe("getMuted / setMuted / toggleMuted", () => {
    it("should get muted state", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          GetInputMute: () => ({ inputMuted: true }),
        });

        expect(yield* input.getMuted()).toBe(true);
      }));

    it("should set muted state", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputMute: () => ({}),
        });

        yield* input.setMuted(true);

        expect(calls).toContainEqual({
          requestType: "SetInputMute",
          requestData: { inputName: "Chat", inputMuted: true },
        });
      }));

    it("should toggle muted state and return new state", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          ToggleInputMute: () => ({ inputMuted: false }),
        });

        expect(yield* input.toggleMuted()).toBe(false);
        expect(calls[0]?.requestType).toBe("ToggleInputMute");
      }));
  });

  describe("getVolume / setVolume", () => {
    it("should get volume as { db, mul }", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          GetInputVolume: () => ({
            inputVolumeDb: -6.0,
            inputVolumeMul: 0.5,
          }),
        });

        expect(yield* input.getVolume()).toEqual({
          db: -6.0,
          mul: 0.5,
        });
      }));

    it("should set volume by dB", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputVolume: () => ({}),
        });

        yield* input.setVolume({ db: -12.0 });

        expect(calls).toContainEqual({
          requestType: "SetInputVolume",
          requestData: { inputName: "Chat", inputVolumeDb: -12.0 },
        });
      }));

    it("should set volume by multiplier", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputVolume: () => ({}),
        });

        yield* input.setVolume({ mul: 0.75 });

        expect(calls).toContainEqual({
          requestType: "SetInputVolume",
          requestData: { inputName: "Chat", inputVolumeMul: 0.75 },
        });
      }));
  });

  describe("getAudioSyncOffset / setAudioSyncOffset", () => {
    it("should get audio sync offset", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          GetInputAudioSyncOffset: () => ({ inputAudioSyncOffset: 150 }),
        });

        expect(yield* input.getAudioSyncOffset()).toBe(150);
      }));

    it("should set audio sync offset", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputAudioSyncOffset: () => ({}),
        });

        yield* input.setAudioSyncOffset(200);

        expect(calls).toContainEqual({
          requestType: "SetInputAudioSyncOffset",
          requestData: { inputName: "Chat", inputAudioSyncOffset: 200 },
        });
      }));
  });

  describe("setAudioMonitorType", () => {
    it("should set monitor type to none", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputAudioMonitorType: () => ({}),
        });

        yield* input.setAudioMonitorType("none");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_NONE",
          },
        });
      }));

    it("should set monitor type to monitorOnly", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputAudioMonitorType: () => ({}),
        });

        yield* input.setAudioMonitorType("monitorOnly");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_MONITOR_ONLY",
          },
        });
      }));

    it("should set monitor type to monitorAndOutput", () =>
      Effect.gen(function* () {
        const { input, calls } = yield* createTestInput({
          SetInputAudioMonitorType: () => ({}),
        });

        yield* input.setAudioMonitorType("monitorAndOutput");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT",
          },
        });
      }));
  });

  describe("getFilters", () => {
    it("should return filter list from OBS", () =>
      Effect.gen(function* () {
        const mockFilters = [
          {
            filterEnabled: true,
            filterIndex: 0,
            filterKind: "color_filter_v2",
            filterName: "Color Fix",
            filterSettings: { gamma: 1.5 },
          },
        ];

        const { input } = yield* createTestInput({
          GetSourceFilterList: () => ({ filters: mockFilters }),
        });

        expect(yield* input.getFilters()).toEqual(mockFilters);
      }));
  });

  describe("name and kind", () => {
    it("should expose name and kind properties", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput();

        expect(input.name).toBe("Chat");
        expect(input.kind).toBe("browser_source");
      }));
  });
});
