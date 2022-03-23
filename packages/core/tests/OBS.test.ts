import { Input, Scene } from "../src";
import { MockInput } from "../src/mocks/MockInput";
import { obs } from "./utils";

describe("clean", () => {
  it("removes dangling scenes from OBS", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new MockInput({
            name: "Source",
          }),
        },
      },
    });

    await scene.create(obs);

    const { scenes: scenesBeforeClean } = await obs.call("GetSceneList");
    expect(
      scenesBeforeClean.find(({ sceneName }) => sceneName === scene.name)
    ).not.toBeUndefined();

    obs.inputs.clear();
    obs.scenes.clear();

    await obs.clean();

    const { scenes: scenesAfterClean } = await obs.call("GetSceneList");
    expect(
      scenesAfterClean.find(({ sceneName }) => sceneName === scene.name)
    ).toBeUndefined();
  });

  it("removes dangling scenes from code", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new MockInput({
            name: "Source",
          }),
        },
      },
    });

    await scene.create(obs);

    const { scenes: scenesBeforeClean } = await obs.call("GetSceneList");
    expect(
      scenesBeforeClean.find(({ sceneName }) => sceneName === scene.name)
    ).not.toBeUndefined();

    await obs.call("RemoveScene", {
      sceneName: scene.name,
    });

    const { scenes: scenesAfterRemove } = await obs.call("GetSceneList");
    expect(
      scenesAfterRemove.find(({ sceneName }) => sceneName === scene.name)
    ).toBeUndefined();

    await obs.clean();

    expect(obs.scenes.get(scene.name)).toBeUndefined();
  });

  it("removes dangling inputs from code", async () => {
    const scene = new Scene({
      name: "Scene",
      items: {
        permanent: {
          source: new MockInput({
            name: "Permanent",
          }),
        },
      },
    });

    await scene.create(obs);

    const item = await scene.createItem("test", {
      source: new MockInput({
        name: "Dangling",
      }),
    });

    expect(obs.inputs.get(item.source.name)).not.toBeUndefined();

    await obs.call("RemoveInput", {
      inputName: item.source.name,
    });

    await obs.clean();

    expect(obs.inputs.get(item.source.name)).toBeUndefined();
  });

  it("doesn't remove linked scenes", async () => {
    const sceneName = "Test";

    await obs.call("CreateScene", {
      sceneName,
    });

    const { sceneItemId } = await obs.call("CreateInput", {
      sceneName,
      inputName: "Test Input",
      inputKind: "mock",
    });

    const { scenes: scenesBeforeClean } = await obs.call("GetSceneList");
    expect(scenesBeforeClean.length).toBe(1);

    const scene = new Scene({
      name: sceneName,
      items: {
        item: {
          source: new MockInput({
            name: "Test Input",
          }),
        },
      },
    });

    await scene.link(obs);

    expect(obs.scenes.size).toBe(1);

    await obs.clean();

    const { scenes: scenesAfterClean } = await obs.call("GetSceneList");

    expect(scenesAfterClean.length).toBe(1);
    expect(scene.item("item").id).toBe(sceneItemId);
  });

  // Similar to create/destroy toggling bug JDude experienced a few times
  it("doesn't remove nested scenes", async () => {
    const doubleNested = new Scene({
      name: "Double Nested",
      items: {},
    });

    const nested = new Scene({
      name: "Nested",
      items: {
        doubleNested: {
          source: doubleNested,
        },
      },
    });

    const parent = new Scene({
      name: "Parent",
      items: {
        nested: {
          source: nested,
        },
        doubleNested: {
          source: doubleNested,
        },
      },
    });

    await parent.create(obs);

    await obs.clean();

    const { sceneItems: parentItemsAfter } = await obs.call(
      "GetSceneItemList",
      {
        sceneName: parent.name,
      }
    );
    expect(parentItemsAfter.length).toBe(2);

    const { sceneItems: nestedItemsAfter } = await obs.call(
      "GetSceneItemList",
      {
        sceneName: nested.name,
      }
    );
    expect(nestedItemsAfter.length).toBe(1);

    const { sceneItems: doubleNestedItemsAfter } = await obs.call(
      "GetSceneItemList",
      {
        sceneName: doubleNested.name,
      }
    );
    expect(doubleNestedItemsAfter.length).toBe(0);
  });

  it("fails silently when sources/items are missing", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new MockInput({
            name: "Source",
          }),
        },
      },
    });

    await scene.create(obs);

    await obs.call("RemoveInput", {
      inputName: scene.item("item").source.name,
    });

    expect(() => obs.clean()).not.toThrow();
  });
});

describe("startStreaming", () => {
  it("makes OBS start streaming", async () => {
    await obs.startStreaming();

    const { outputActive } = await obs.call("GetStreamStatus");
    expect(outputActive).toBe(true);
  });
});

describe("stopStreaming", () => {
  it("makes OBS stop streaming", async () => {
    await obs.stopStreaming();

    const { outputActive } = await obs.call("GetStreamStatus");
    expect(outputActive).toBe(false);
  });
});

describe("toggleStreaming", () => {
  it("toggle OBS' streaming state", async () => {
    {
      const { outputActive } = await obs.call("GetStreamStatus");
      expect(outputActive).toBe(false);
    }

    await obs.toggleStreaming();

    {
      const { outputActive } = await obs.call("GetStreamStatus");
      expect(outputActive).toBe(true);
    }

    await obs.toggleStreaming();

    {
      const { outputActive } = await obs.call("GetStreamStatus");
      expect(outputActive).toBe(false);
    }
  });
});
