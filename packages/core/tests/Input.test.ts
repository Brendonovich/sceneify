import {
  CustomInputArgs,
  Input,
  MonitoringType,
  Scene,
  SceneItem,
  SourceFilters,
} from "../src";
import { MockInput } from "../src/mocks/MockInput";
import { obs } from "./utils";

/**
 * Exists to safeguard against pre-189101e, where item instances
 * were added inside createSceneItemObject, which isn't great since
 * the same thing needs to be done in overrides as well.
 */
it("adds item instances with createSceneItemObject overridden", async () => {
  class OverrideInputItem<Input extends OverrideInput> extends SceneItem<Input> {
    constructor(source: Input, scene: Scene, id: number, ref: string) {
      super(source, scene, id, ref);
    }
  }

  class OverrideInput extends MockInput<SourceFilters> {
    override createSceneItemObject(
      scene: Scene,
      id: number,
      ref: string
    ): SceneItem<this> {
      return new OverrideInputItem(this, scene, id, ref);
    }
  }

  const input = new OverrideInput({
    name: "Input",
  });

  const scene = new Scene({
    name: "Test",
    items: {
      item: {
        source: input,
      },
    },
  });

  await scene.create(obs);

  expect(input.itemInstances.size).toBe(1);
});

describe("fetchExists", () => {
  it("succeeds if an input exists with the same name", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    input.obs = obs;
    expect(input.fetchExists()).resolves.toBe(true);
  });

  it("fails if a scene exists with the same name", async () => {
    const input = new Input({
      kind: "test",
      name: "Input",
    });

    const scene = new Scene({
      name: "Input",
      items: {},
    });

    await scene.create(obs);

    input.obs = obs;
    await expect(input.fetchExists()).rejects.toThrow();
  });
});

describe("remove", () => {
  it("removes the input", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);
    await input.remove();

    expect(input.exists).toBe(false);
    expect(scene.item("item")).toBe(undefined);

    const { sceneItems } = await obs.call("GetSceneItemList", {
      sceneName: scene.name,
    });
    expect(sceneItems.length).toBe(0);
  });
});

describe("createFirstSceneItem", () => {
  it("sets properties on creation", async () => {
    const input = new MockInput({
      name: "Input",
      audioMonitorType: MonitoringType.MonitorAndOutput,
      audioSyncOffset: 1,
      muted: true,
      volume: {
        db: 0.5,
      },
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    const { monitorType } = await obs.call("GetInputAudioMonitorType", {
      inputName: input.name,
    });
    expect(monitorType).toBe(MonitoringType.MonitorAndOutput);

    const { inputAudioSyncOffset } = await obs.call("GetInputAudioSyncOffset", {
      inputName: input.name,
    });
    expect(inputAudioSyncOffset).toBe(1);

    const { inputMuted } = await obs.call("GetInputMute", {
      inputName: input.name,
    });
    expect(inputMuted).toBe(true);

    const { inputVolumeDb } = await obs.call("GetInputVolume", {
      inputName: input.name,
    });
    expect(inputVolumeDb).toBe(0.5);
  });
});

describe("toggleMuted", () => {
  it("toggles mute state", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    {
      const { inputMuted } = await obs.call("GetInputMute", {
        inputName: input.name,
      });
      expect(inputMuted).toBe(false);
    }

    await input.toggleMuted();

    {
      const { inputMuted } = await obs.call("GetInputMute", {
        inputName: input.name,
      });
      expect(inputMuted).toBe(true);
    }
  });
});

describe("fetchProperties", () => {
  it("fetches properties", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    {
      const { monitorType } = await obs.call("GetInputAudioMonitorType", {
        inputName: input.name,
      });
      expect(monitorType).toBe(MonitoringType.None);

      const { inputAudioSyncOffset } = await obs.call(
        "GetInputAudioSyncOffset",
        {
          inputName: input.name,
        }
      );
      expect(inputAudioSyncOffset).toBe(0);

      const { inputMuted } = await obs.call("GetInputMute", {
        inputName: input.name,
      });
      expect(inputMuted).toBe(false);

      const { inputVolumeDb } = await obs.call("GetInputVolume", {
        inputName: input.name,
      });
      expect(inputVolumeDb).toBe(0);
    }

    await obs.call("SetInputAudioMonitorType", {
      inputName: input.name,
      monitorType: MonitoringType.MonitorAndOutput,
    });
    await obs.call("SetInputAudioSyncOffset", {
      inputName: input.name,
      inputAudioSyncOffset: 1,
    });
    await obs.call("SetInputMute", {
      inputName: input.name,
      inputMuted: true,
    });
    await obs.call("SetInputVolume", {
      inputName: input.name,
      inputVolumeDb: 0.5,
    });

    await input.fetchProperties();

    expect(input.audioMonitorType).toBe(MonitoringType.MonitorAndOutput);
    expect(input.audioSyncOffset).toBe(1);
    expect(input.muted).toBe(true);
    expect(input.volume.db).toBe(0.5);
  });
});

describe("setName", () => {
  it("renames the input", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    expect(input.name).toBe("Input");

    await input.setName("New Input");
    expect(input.name).toBe("New Input");
  });

  it("reports error if source with name already exists", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const input2 = new MockInput({
      name: "Input2",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        input: {
          source: input,
        },
        input2: { source: input2 },
      },
    });

    await scene.create(obs);

    await expect(input.setName("Input2")).rejects.toThrow("Input with name");
    await expect(input.setName("Scene")).rejects.toThrow("Scene with name");
  });
});
