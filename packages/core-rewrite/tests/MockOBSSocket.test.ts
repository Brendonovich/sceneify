import { describe, expect, it } from "vitest";
import { Effect, Layer, Schema } from "effect";
import { FilterType } from "../src/FilterType.js";
import { Input } from "../src/Input.js";
import { InputType } from "../src/InputType.js";
import { MockOBSSocket } from "../src/index.js";
import { Scene } from "../src/Scene.js";
import * as Sceneify from "../src/Sceneify.js";

const runCall = (
  mock: ReturnType<typeof MockOBSSocket.make>,
  requestType: string,
  requestData?: Record<string, unknown>
) =>
  Effect.runPromise(
    mock.service.call(requestType as any, requestData as any) as Effect.Effect<
      any,
      any
    >
  );

describe("MockOBSSocket", () => {
  it("uses immutable snapshots with structural sharing", async () => {
    const mock = MockOBSSocket.make({
      inputs: [
        { name: "Chat", kind: "browser_source", settings: { width: 640 } },
        { name: "Camera", kind: "av_capture_input_v2" },
      ],
      scenes: [
        { name: "Main", items: [{ sourceName: "Chat" }] },
        { name: "Other" },
      ],
    });
    const initial = mock.snapshot();

    const response = await runCall(mock, "GetInputSettings", {
      inputName: "Chat",
    });
    expect(mock.snapshot()).toBe(initial);
    expect(Object.isFrozen(initial)).toBe(true);
    expect(Object.isFrozen(initial.inputs[0]?.settings)).toBe(true);
    expect(() => {
      response.inputSettings.width = 900;
    }).toThrow(TypeError);

    await runCall(mock, "SetInputSettings", {
      inputName: "Chat",
      inputSettings: { width: 800 },
    });
    const updated = mock.snapshot();

    expect(updated).not.toBe(initial);
    expect(updated.scenes).toBe(initial.scenes);
    expect(updated.inputs[1]).toBe(initial.inputs[1]);
    expect(updated.inputs[0]).not.toBe(initial.inputs[0]);
    expect(initial.inputs[0]?.settings).toEqual({ width: 640 });
    expect(updated.inputs[0]?.settings).toEqual({ width: 800 });

    const unaffectedScene = updated.scenes[1];
    await runCall(mock, "RemoveInput", { inputName: "Chat" });
    expect(mock.snapshot().scenes[1]).toBe(unaffectedScene);
    expect(Object.isFrozen(mock.calls)).toBe(true);
    expect(Object.isFrozen(mock.calls[0]?.requestData)).toBe(true);
  });

  it("seeds scenes and inputs without connecting to OBS", async () => {
    const mock = MockOBSSocket.make({
      inputs: [
        {
          name: "Chat",
          kind: "browser_source",
          settings: { url: "https://example.com", width: 1920, height: 1080 },
        },
      ],
      scenes: [{ name: "Main", items: [{ sourceName: "Chat" }] }],
    });

    const sceneList = await runCall(mock, "GetSceneList");
    const itemList = await runCall(mock, "GetSceneItemList", {
      sceneName: "Main",
    });

    expect(sceneList.scenes).toMatchObject([{ sceneName: "Main" }]);
    expect(itemList.sceneItems).toMatchObject([
      {
        inputKind: "browser_source",
        sceneItemId: 1,
        sceneItemIndex: 0,
        sourceName: "Chat",
        sceneItemTransform: {
          sourceWidth: 1920,
          sourceHeight: 1080,
          width: 1920,
          height: 1080,
        },
      },
    ]);
    expect(mock.calls).toHaveLength(2);
  });

  it("persists request mutations in memory", async () => {
    const mock = MockOBSSocket.make();

    await runCall(mock, "CreateScene", { sceneName: "Main" });
    const created = await runCall(mock, "CreateInput", {
      sceneName: "Main",
      inputName: "Chat",
      inputKind: "browser_source",
      inputSettings: { width: 640, height: 360 },
    });
    await runCall(mock, "SetInputSettings", {
      inputName: "Chat",
      inputSettings: { width: 800 },
    });
    await runCall(mock, "SetInputMute", {
      inputName: "Chat",
      inputMuted: true,
    });
    await runCall(mock, "SetInputVolume", {
      inputName: "Chat",
      inputVolumeMul: 0.5,
    });
    await runCall(mock, "SetSourcePrivateSettings", {
      sourceName: "Chat",
      sourceSettings: { SCENEIFY: { init: "created" } },
    });
    await runCall(mock, "SetSceneItemPrivateSettings", {
      sceneName: "Main",
      sceneItemId: created.sceneItemId,
      sceneItemSettings: { SCENEIFY: { init: "created" } },
    });
    await runCall(mock, "SetSceneItemTransform", {
      sceneName: "Main",
      sceneItemId: created.sceneItemId,
      sceneItemTransform: { positionX: 20, scaleX: 0.5 },
    });
    await runCall(mock, "CreateSourceFilter", {
      sourceName: "Chat",
      filterName: "Color",
      filterKind: "color_filter_v2",
      filterSettings: { brightness: 0.1 },
    });
    await runCall(mock, "SetSourceFilterSettings", {
      sourceName: "Chat",
      filterName: "Color",
      filterSettings: { contrast: 0.2 },
    });
    await runCall(mock, "SetSourceFilterEnabled", {
      sourceName: "Chat",
      filterName: "Color",
      filterEnabled: false,
    });

    expect(
      await runCall(mock, "GetInputSettings", { inputName: "Chat" })
    ).toMatchObject({
      inputKind: "browser_source",
      inputSettings: { width: 800, height: 360 },
    });
    expect(await runCall(mock, "GetInputMute", { inputName: "Chat" })).toEqual({
      inputMuted: true,
    });
    expect(
      await runCall(mock, "GetInputVolume", { inputName: "Chat" })
    ).toMatchObject({ inputVolumeMul: 0.5 });
    expect(
      await runCall(mock, "GetSourceFilter", {
        sourceName: "Chat",
        filterName: "Color",
      })
    ).toMatchObject({
      filterEnabled: false,
      filterKind: "color_filter_v2",
      filterSettings: { brightness: 0.1, contrast: 0.2 },
    });

    const state = mock.snapshot();
    expect(state.inputs[0]?.privateSettings).toEqual({
      SCENEIFY: { init: "created" },
    });
    expect(state.scenes[0]?.items[0]).toMatchObject({
      id: created.sceneItemId,
      transform: { positionX: 20, scaleX: 0.5 },
      privateSettings: { SCENEIFY: { init: "created" } },
    });
  });

  it("reproduces OBS conflicts and missing-resource failures", async () => {
    const mock = MockOBSSocket.make({ scenes: [{ name: "Main" }] });
    const either = (
      requestType: string,
      requestData?: Record<string, unknown>
    ) =>
      Effect.runPromise(
        Effect.either(
          mock.service.call(
            requestType as any,
            requestData as any
          ) as Effect.Effect<any, any>
        )
      );

    expect(await either("CreateScene", { sceneName: "Main" })).toMatchObject({
      _tag: "Left",
      left: {
        _tag: "OBSError",
        message: expect.stringContaining(
          "A source already exists by that scene name."
        ),
        cause: { code: 601 },
      },
    });

    expect(
      await either("GetInputSettings", { inputName: "Missing" })
    ).toMatchObject({
      _tag: "Left",
      left: { _tag: "OBSError", cause: { code: 600 } },
    });

    expect(await either("UnsupportedRequest")).toMatchObject({
      _tag: "Left",
      left: { _tag: "OBSError", cause: { code: 204 } },
    });
  });

  it("backs the exposed ws.call method with the same memory state", async () => {
    const mock = MockOBSSocket.make();

    await (mock.service.ws as any).call("CreateScene", { sceneName: "Main" });
    const scenes = await (mock.service.ws as any).call("GetSceneList");

    expect(scenes.scenes).toMatchObject([{ sceneName: "Main" }]);
    expect(mock.calls.map((call) => call.requestType)).toEqual([
      "CreateScene",
      "GetSceneList",
    ]);
  });

  it("supports a complete Scene.sync without request handlers", async () => {
    class BrowserSource extends InputType("browser_source")({
      url: Schema.String,
      width: Schema.Number,
      height: Schema.Number,
    }) {}
    class ColorCorrection extends FilterType("color_filter_v2")({
      brightness: Schema.Number,
    }) {}

    const chat = Input.declare(BrowserSource, {
      name: "Chat",
      settings: { url: "https://example.com", width: 800, height: 600 },
      filters: {
        color: {
          type: ColorCorrection,
          name: "Color",
          settings: { brightness: 0.1 },
          enabled: false,
        },
      },
    });
    const declaration = Scene.declare({
      name: "Main",
      items: {
        chat: {
          source: chat,
          enabled: false,
          lock: true,
          transform: { positionX: 100 },
        },
      },
    });
    const mock = MockOBSSocket.make();
    const layer = Layer.merge(mock.layer, Sceneify.layer);

    const runtime = await Effect.runPromise(
      Scene.sync(declaration).pipe(Effect.scoped, Effect.provide(layer))
    );

    expect(runtime.item("chat").input.name).toBe("Chat");
    expect(mock.snapshot()).toMatchObject({
      scenes: [
        {
          name: "Main",
          privateSettings: { SCENEIFY: { init: "created" } },
          items: [
            {
              sourceName: "Chat",
              enabled: false,
              locked: true,
              transform: { positionX: 100 },
            },
          ],
        },
      ],
      inputs: [
        {
          name: "Chat",
          kind: "browser_source",
          privateSettings: {
            SCENEIFY: { init: "created", filters: [{ name: "Color" }] },
          },
          filters: [
            {
              name: "Color",
              kind: "color_filter_v2",
              enabled: false,
              settings: { brightness: 0.1 },
            },
          ],
        },
      ],
    });
  });
});
