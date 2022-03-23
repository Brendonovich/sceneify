import { Filter, Scene } from "../src";
import { MockFilter } from "../src/mocks/MockFilter";
import { MockInput } from "../src/mocks/MockInput";
import { obs, resetSceneify } from "./utils";

describe("createSceneItem", () => {
  it("fails if source is not initialized", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await expect(input.createSceneItem("test", scene)).rejects.toThrow(
      "not initialized"
    );
  });

  it("finds existing item with refs", async () => {
    // make items in obs
    const existingInput = new MockInput({
      name: "Input",
    });

    const existingScene = new Scene({
      name: "Test",
      items: {
        test: {
          source: existingInput,
        },
      },
    });

    await existingScene.create(obs);

    resetSceneify();

    const input = new MockInput({
      name: existingInput.name,
    });

    const scene = new Scene({
      name: existingScene.name,
      items: {},
    });

    await input.initialize(obs);

    let item = await input.createSceneItem("test", scene);

    expect(item.id).toBe(existingScene.item("test").id);
    expect(existingInput.refs).toEqual(input.refs);
  });

  it("creates a new item if ref is broken", async () => {
    // make items in obs
    const existingInput = new MockInput({
      name: "Input",
    });

    const existingScene = new Scene({
      name: "Test",
      items: {
        test: {
          source: existingInput,
        },
        test2: {
          source: existingInput,
        },
      },
    });

    await existingScene.create(obs);

    expect(existingInput.refs).toEqual({
      [existingScene.name]: {
        [existingScene.item("test").ref]: existingScene.item("test").id,
        [existingScene.item("test2").ref]: existingScene.item("test2").id,
      },
    });

    await obs.call("RemoveSceneItem", {
      sceneName: existingScene.name,
      sceneItemId: existingScene.item("test").id,
    });

    resetSceneify();

    const input = new MockInput({
      name: existingInput.name,
    });

    const scene = new Scene({
      name: existingScene.name,
      items: {},
    });

    await input.initialize(obs);

    let item = await input.createSceneItem("test", scene);

    expect(item.id).not.toBe(existingScene.item("test").id);

    expect(input.refs).toEqual({
      [scene.name]: {
        [item.ref]: item.id,
        [existingScene.item("test2").ref]: existingScene.item("test2").id,
      },
    });
  });

  it("adds filters to the source", async () => {
    const scene = await new Scene({
      name: "Test",
      items: {},
    }).create(obs);

    const input = new MockInput({
      name: "Input",
      filters: {
        test: new MockFilter({
          name: "Filter",
        }),
      },
    });

    await input.initialize(obs);
    await input.createSceneItem("test", scene);

    expect(input.filters.length).toBe(1);

    const { filters } = await obs.call("GetSourceFilterList", {
      sourceName: input.name,
    });
    expect(filters.length).toBe(1);
  });
});
