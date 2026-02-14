import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { InputType } from "../src/InputType.js";
import { Input } from "../src/Input.js";
import { createMockOBSSocket, type CallHandler } from "./helpers.js";

class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
}>() {}

function createTestInput(handlers: Record<string, CallHandler> = {}) {
  const mock = createMockOBSSocket({ handlers });
  const input = Input.make<typeof BrowserSource>(
    mock.service,
    "Chat",
    "browser_source"
  );
  return { input, calls: mock.calls };
}

describe("Input", () => {
  describe("setSettings", () => {
    it("should call SetInputSettings with the input name and settings", async () => {
      const { input, calls } = createTestInput({
        SetInputSettings: () => ({}),
      });

      await Effect.runPromise(
        input.setSettings({ url: "https://example.com", width: 1920 })
      );

      expect(calls).toContainEqual({
        requestType: "SetInputSettings",
        requestData: {
          inputName: "Chat",
          inputSettings: { url: "https://example.com", width: 1920 },
        },
      });
    });

    it("should support partial settings", async () => {
      const { input, calls } = createTestInput({
        SetInputSettings: () => ({}),
      });

      await Effect.runPromise(
        input.setSettings({ url: "https://new-url.com" })
      );

      expect(calls[0]?.requestData).toEqual({
        inputName: "Chat",
        inputSettings: { url: "https://new-url.com" },
      });
    });
  });

  describe("getSettings", () => {
    it("should call GetInputSettings and return the settings", async () => {
      const { input } = createTestInput({
        GetInputSettings: () => ({
          inputSettings: {
            url: "https://example.com",
            width: 1920,
            height: 1080,
          },
          inputKind: "browser_source",
        }),
      });

      const settings = await Effect.runPromise(input.getSettings());
      expect(settings).toEqual({
        url: "https://example.com",
        width: 1920,
        height: 1080,
      });
    });
  });

  describe("getMuted / setMuted / toggleMuted", () => {
    it("should get muted state", async () => {
      const { input } = createTestInput({
        GetInputMute: () => ({ inputMuted: true }),
      });

      expect(await Effect.runPromise(input.getMuted())).toBe(true);
    });

    it("should set muted state", async () => {
      const { input, calls } = createTestInput({
        SetInputMute: () => ({}),
      });

      await Effect.runPromise(input.setMuted(true));

      expect(calls).toContainEqual({
        requestType: "SetInputMute",
        requestData: { inputName: "Chat", inputMuted: true },
      });
    });

    it("should toggle muted state and return new state", async () => {
      const { input, calls } = createTestInput({
        ToggleInputMute: () => ({ inputMuted: false }),
      });

      expect(await Effect.runPromise(input.toggleMuted())).toBe(false);
      expect(calls[0]?.requestType).toBe("ToggleInputMute");
    });
  });

  describe("getVolume / setVolume", () => {
    it("should get volume as { db, mul }", async () => {
      const { input } = createTestInput({
        GetInputVolume: () => ({
          inputVolumeDb: -6.0,
          inputVolumeMul: 0.5,
        }),
      });

      expect(await Effect.runPromise(input.getVolume())).toEqual({
        db: -6.0,
        mul: 0.5,
      });
    });

    it("should set volume by dB", async () => {
      const { input, calls } = createTestInput({
        SetInputVolume: () => ({}),
      });

      await Effect.runPromise(input.setVolume({ db: -12.0 }));

      expect(calls).toContainEqual({
        requestType: "SetInputVolume",
        requestData: { inputName: "Chat", inputVolumeDb: -12.0 },
      });
    });

    it("should set volume by multiplier", async () => {
      const { input, calls } = createTestInput({
        SetInputVolume: () => ({}),
      });

      await Effect.runPromise(input.setVolume({ mul: 0.75 }));

      expect(calls).toContainEqual({
        requestType: "SetInputVolume",
        requestData: { inputName: "Chat", inputVolumeMul: 0.75 },
      });
    });
  });

  describe("getAudioSyncOffset / setAudioSyncOffset", () => {
    it("should get audio sync offset", async () => {
      const { input } = createTestInput({
        GetInputAudioSyncOffset: () => ({ inputAudioSyncOffset: 150 }),
      });

      expect(await Effect.runPromise(input.getAudioSyncOffset())).toBe(150);
    });

    it("should set audio sync offset", async () => {
      const { input, calls } = createTestInput({
        SetInputAudioSyncOffset: () => ({}),
      });

      await Effect.runPromise(input.setAudioSyncOffset(200));

      expect(calls).toContainEqual({
        requestType: "SetInputAudioSyncOffset",
        requestData: { inputName: "Chat", inputAudioSyncOffset: 200 },
      });
    });
  });

  describe("setAudioMonitorType", () => {
    it("should set monitor type to none", async () => {
      const { input, calls } = createTestInput({
        SetInputAudioMonitorType: () => ({}),
      });

      await Effect.runPromise(input.setAudioMonitorType("none"));

      expect(calls).toContainEqual({
        requestType: "SetInputAudioMonitorType",
        requestData: {
          inputName: "Chat",
          monitorType: "OBS_MONITORING_TYPE_NONE",
        },
      });
    });

    it("should set monitor type to monitorOnly", async () => {
      const { input, calls } = createTestInput({
        SetInputAudioMonitorType: () => ({}),
      });

      await Effect.runPromise(input.setAudioMonitorType("monitorOnly"));

      expect(calls).toContainEqual({
        requestType: "SetInputAudioMonitorType",
        requestData: {
          inputName: "Chat",
          monitorType: "OBS_MONITORING_TYPE_MONITOR_ONLY",
        },
      });
    });

    it("should set monitor type to monitorAndOutput", async () => {
      const { input, calls } = createTestInput({
        SetInputAudioMonitorType: () => ({}),
      });

      await Effect.runPromise(input.setAudioMonitorType("monitorAndOutput"));

      expect(calls).toContainEqual({
        requestType: "SetInputAudioMonitorType",
        requestData: {
          inputName: "Chat",
          monitorType: "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT",
        },
      });
    });
  });

  describe("getFilters", () => {
    it("should return filter list from OBS", async () => {
      const mockFilters = [
        {
          filterEnabled: true,
          filterIndex: 0,
          filterKind: "color_filter_v2",
          filterName: "Color Fix",
          filterSettings: { gamma: 1.5 },
        },
      ];

      const { input } = createTestInput({
        GetSourceFilterList: () => ({ filters: mockFilters }),
      });

      expect(await Effect.runPromise(input.getFilters())).toEqual(mockFilters);
    });
  });

  describe("name and kind", () => {
    it("should expose name and kind properties", () => {
      const mock = createMockOBSSocket();
      const input = Input.make<typeof BrowserSource>(
        mock.service,
        "My Browser",
        "browser_source"
      );

      expect(input.name).toBe("My Browser");
      expect(input.kind).toBe("browser_source");
    });
  });
});
