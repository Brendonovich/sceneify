import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { InputType } from "../src/InputType.js";
import { Input } from "../src/Input.js";
import { MockOBSSocket } from "../src/index.js";
import { createMockOBSSocket } from "./helpers.js";

class BrowserSource extends InputType("browser_source")({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
}) {}

const createTestInput = Effect.fnUntraced(function* (
  options: MockOBSSocket.Options = {}
) {
  const mock = createMockOBSSocket({
    inputs: [
      {
        name: "Chat",
        kind: "browser_source",
        settings: { url: "https://example.com", width: 1920, height: 1080 },
      },
    ],
    ...options,
  });
  const input = yield* Input.make<typeof BrowserSource>(
    "Chat",
    "browser_source"
  ).pipe(Effect.provide(mock.layer));
  return { input, calls: mock.calls, snapshot: mock.snapshot };
});

describe("Input", () => {
  describe("setSettings", () => {
    it("should call SetInputSettings with the input name and settings", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setSettings({ url: "https://example.com", width: 1920 });

        expect(calls).toContainEqual({
          requestType: "SetInputSettings",
          requestData: {
            inputName: "Chat",
            inputSettings: { url: "https://example.com", width: 1920 },
          },
        });
        expect(snapshot().inputs[0]?.settings).toEqual({
          url: "https://example.com",
          width: 1920,
          height: 1080,
        });
      }));

    it("should support partial settings", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setSettings({ url: "https://new-url.com" });

        expect(calls[0]?.requestData).toEqual({
          inputName: "Chat",
          inputSettings: { url: "https://new-url.com" },
        });
        expect(snapshot().inputs[0]?.settings).toEqual({
          url: "https://new-url.com",
          width: 1920,
          height: 1080,
        });
      }));
  });

  describe("getSettings", () => {
    it("should call GetInputSettings and return the settings", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput();

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
          inputs: [{ name: "Chat", kind: "browser_source", muted: true }],
        });

        expect(yield* input.getMuted()).toBe(true);
      }));

    it("should set muted state", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setMuted(true);

        expect(calls).toContainEqual({
          requestType: "SetInputMute",
          requestData: { inputName: "Chat", inputMuted: true },
        });
        expect(snapshot().inputs[0]?.muted).toBe(true);
      }));

    it("should toggle muted state and return new state", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput({
          inputs: [{ name: "Chat", kind: "browser_source", muted: true }],
        });

        expect(yield* input.toggleMuted()).toBe(false);
        expect(calls[0]?.requestType).toBe("ToggleInputMute");
        expect(snapshot().inputs[0]?.muted).toBe(false);
      }));
  });

  describe("getVolume / setVolume", () => {
    it("should get volume as { db, mul }", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          inputs: [{ name: "Chat", kind: "browser_source", volumeMul: 0.5 }],
        });

        const volume = yield* input.getVolume();
        expect(volume.db).toBeCloseTo(-6.02);
        expect(volume.mul).toBe(0.5);
      }));

    it("should set volume by dB", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setVolume({ db: -12.0 });

        expect(calls).toContainEqual({
          requestType: "SetInputVolume",
          requestData: { inputName: "Chat", inputVolumeDb: -12.0 },
        });
        expect(snapshot().inputs[0]?.volumeMul).toBeCloseTo(0.2512);
      }));

    it("should set volume by multiplier", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setVolume({ mul: 0.75 });

        expect(calls).toContainEqual({
          requestType: "SetInputVolume",
          requestData: { inputName: "Chat", inputVolumeMul: 0.75 },
        });
        expect(snapshot().inputs[0]?.volumeMul).toBe(0.75);
      }));
  });

  describe("getAudioSyncOffset / setAudioSyncOffset", () => {
    it("should get audio sync offset", () =>
      Effect.gen(function* () {
        const { input } = yield* createTestInput({
          inputs: [
            { name: "Chat", kind: "browser_source", audioSyncOffset: 150 },
          ],
        });

        expect(yield* input.getAudioSyncOffset()).toBe(150);
      }));

    it("should set audio sync offset", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setAudioSyncOffset(200);

        expect(calls).toContainEqual({
          requestType: "SetInputAudioSyncOffset",
          requestData: { inputName: "Chat", inputAudioSyncOffset: 200 },
        });
        expect(snapshot().inputs[0]?.audioSyncOffset).toBe(200);
      }));
  });

  describe("setAudioMonitorType", () => {
    it("should set monitor type to none", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput({
          inputs: [
            {
              name: "Chat",
              kind: "browser_source",
              audioMonitorType: "OBS_MONITORING_TYPE_MONITOR_ONLY",
            },
          ],
        });

        yield* input.setAudioMonitorType("none");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_NONE",
          },
        });
        expect(snapshot().inputs[0]?.audioMonitorType).toBe(
          "OBS_MONITORING_TYPE_NONE"
        );
      }));

    it("should set monitor type to monitorOnly", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setAudioMonitorType("monitorOnly");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_MONITOR_ONLY",
          },
        });
        expect(snapshot().inputs[0]?.audioMonitorType).toBe(
          "OBS_MONITORING_TYPE_MONITOR_ONLY"
        );
      }));

    it("should set monitor type to monitorAndOutput", () =>
      Effect.gen(function* () {
        const { input, calls, snapshot } = yield* createTestInput();

        yield* input.setAudioMonitorType("monitorAndOutput");

        expect(calls).toContainEqual({
          requestType: "SetInputAudioMonitorType",
          requestData: {
            inputName: "Chat",
            monitorType: "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT",
          },
        });
        expect(snapshot().inputs[0]?.audioMonitorType).toBe(
          "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT"
        );
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
          inputs: [
            {
              name: "Chat",
              kind: "browser_source",
              filters: [
                {
                  name: "Color Fix",
                  kind: "color_filter_v2",
                  settings: { gamma: 1.5 },
                  enabled: true,
                },
              ],
            },
          ],
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
