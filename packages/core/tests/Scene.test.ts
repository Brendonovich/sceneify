import { Scene, Input, Filter } from "../src";
import { MockFilter } from "../src/mocks/MockFilter";
import { MockInput } from "../src/mocks/MockInput";
import { obs } from "./utils";

describe("create", () => {
  it("creates new scenes", async () => {
    const scene = new Scene({ name: "Test", items: {} });

    await scene.create(obs);

    expect(scene.initialized).toBe(true);
    expect(scene.exists).toBe(true);

    const obsScenes = await obs.call("GetSceneList");
    expect(
      obsScenes.scenes.find((s) => s.sceneName === scene.name)
    ).not.toBeUndefined();
  });

  it("detects existing scenes", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await obs.call("CreateScene", { sceneName: scene.name });

    await scene.create(obs);

    expect(scene.initialized).toBe(true);
    expect(scene.exists).toBe(true);
  });

  it("creates nested scenes", async () => {
    const nested3 = new Scene({
      name: "Nested 3",
      items: {},
    });

    const nested2 = new Scene({
      name: "Nested 2",
      items: {
        nested: {
          source: nested3,
        },
      },
    });

    const nested1 = new Scene({
      name: "Nested 1",
      items: {
        nested: {
          source: nested2,
        },
      },
    });

    const parent = new Scene({
      name: "Parent",
      items: {
        nested: {
          source: nested1,
        },
      },
    });

    jest.spyOn(nested1, "create");
    jest.spyOn(nested2, "create");
    jest.spyOn(nested3, "create");

    await parent.create(obs);

    expect(nested1.create).toHaveBeenCalled();
    expect(nested2.create).toHaveBeenCalled();
    expect(nested3.create).toHaveBeenCalled();

    const { scenes } = await obs.call("GetSceneList");
    expect(scenes.length).toBe(4);
  });

  it("detects existing sources", async () => {
    const existingSource = new MockInput({
      name: "Existing Source",
    });

    const tempScene = new Scene({
      name: "Temp",
      items: {
        existing: {
          source: existingSource,
        },
      },
    });

    await tempScene.create(obs);

    const mainScene = new Scene({
      name: "Main",
      items: {
        existing: {
          source: existingSource,
        },
      },
    });

    await mainScene.create(obs);

    expect(mainScene.item("existing").source).toBe(
      tempScene.item("existing").source
    );
    expect(existingSource.itemInstances.size).toBe(2);
  });

  it("adds filters to the scene", async () => {
    const filter = new MockFilter({
      name: "Filter",
    });

    const scene = new Scene({
      name: "Scene",
      items: {},
      filters: {
        test: filter,
      },
    });

    await scene.create(obs);

    expect(filter.source).toBe(scene);
    expect(scene.filters.length).toBe(1);
  });
});

describe("createItem", () => {
  it("can create multiple items of a single source", async () => {
    const scene = await new Scene({
      name: "Test",
      items: {},
    }).create(obs);

    const testInput = new MockInput({
      name: "Colour Source",
    });

    const item1 = await scene.createItem("item1", {
      source: testInput,
    });

    const item2 = await scene.createItem("item2", {
      source: testInput,
    });

    expect(item1.id).not.toBe(item2.id);
    expect(item1.source).toBe(item2.source);

    const { sceneItems } = await obs.call("GetSceneItemList", {
      sceneName: scene.name,
    });

    expect(sceneItems.length).toBe(2);
  });

  it("sets item transforms", async () => {
    const scene = await new Scene({
      name: "Test",
      items: {},
    }).create(obs);

    const item = await scene.createItem("item", {
      source: new MockInput({
        name: "Colour Source",
      }),
      positionX: 100,
      positionY: 100,
      rotation: 90,
      scaleX: 1.5,
      scaleY: 0.5,
    });

    const { sceneItemTransform } = await obs.call("GetSceneItemTransform", {
      sceneName: scene.name,
      sceneItemId: item.id,
    });

    expect(sceneItemTransform).toEqual(
      expect.objectContaining({
        positionX: 100,
        positionY: 100,
        rotation: 90,
        scaleX: 1.5,
        scaleY: 0.5,
      })
    );
  });
});

describe("link", () => {
  it("links to existing scene and item", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: scene.name,
    });

    await obs.call("CreateInput", {
      sceneName: scene.name,
      inputName: input.name,
      inputKind: input.kind,
    });

    await expect(scene.link(obs)).resolves.not.toThrow();

    const { sceneItems } = await obs.call("GetSceneItemList", {
      sceneName: scene.name,
    });

    expect(sceneItems).toContainEqual(
      expect.objectContaining({
        sceneItemId: scene.item("test").id,
      })
    );
  });

  it("links nested scenes", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const nested = new Scene({
      name: "Nested",
      items: {
        test: {
          source: input,
        },
      },
    });

    const parent = new Scene({
      name: "Parent",
      items: {
        nested: {
          source: nested,
        },
        test: {
          source: input,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: nested.name,
    });

    await obs.call("CreateScene", {
      sceneName: parent.name,
    });

    await obs.call("CreateSceneItem", {
      sceneName: parent.name,
      sourceName: nested.name,
    });

    let nestedItem = await obs.call("CreateInput", {
      sceneName: nested.name,
      inputName: input.name,
      inputKind: input.kind,
    });

    let parentItem = await obs.call("CreateSceneItem", {
      sceneName: parent.name,
      sourceName: input.name,
    });

    await parent.link(obs);

    expect(nestedItem.sceneItemId).toBe(nested.item("test").id);
    expect(parentItem.sceneItemId).toBe(parent.item("test").id);
  });

  it("fails for already created scenes", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create(obs);

    await expect(scene.link(obs)).rejects.toThrow();
  });

  it("fails for already linked scenes", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await obs.call("CreateScene", { sceneName: scene.name });

    await scene.link(obs);

    await expect(scene.link(obs)).rejects.toThrow();
  });

  it("fails to link to scenes that don't exist", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await expect(scene.link(obs)).rejects.toThrow();
  });

  it("fails if a source doesn't exist in the scene", async () => {
    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: new MockInput({
            name: "Input",
          }),
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: scene.name,
    });

    expect(scene.link(obs)).rejects.toThrow();
  });

  it("fails if multiple items of a source exist in the scene", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: scene.name,
    });

    await obs.call("CreateInput", {
      sceneName: scene.name,
      inputName: input.name,
      inputKind: input.kind,
    });

    await obs.call("CreateSceneItem", {
      sceneName: scene.name,
      sourceName: input.name,
    });

    await expect(scene.link(obs)).rejects.toThrow();
  });

  it("sets item transforms if requested", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
          positionX: 100,
          positionY: 100,
          rotation: 90,
          scaleX: 1.5,
          scaleY: 0.5,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: scene.name,
    });

    await obs.call("CreateInput", {
      sceneName: scene.name,
      inputName: input.name,
      inputKind: input.kind,
    });

    await scene.link(obs, {
      setItemTransforms: true,
    });

    const { sceneItemTransform } = await obs.call("GetSceneItemTransform", {
      sceneName: scene.name,
      sceneItemId: scene.item("test").id,
    });

    expect(sceneItemTransform).toEqual(
      expect.objectContaining({
        positionX: 100,
        positionY: 100,
        rotation: 90,
        scaleX: 1.5,
        scaleY: 0.5,
      })
    );
  });

  it("sets input settings when requested", async () => {
    const input = new MockInput({
      name: "Input",
      settings: {
        a: 1,
      },
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: scene.name,
    });

    await obs.call("CreateInput", {
      sceneName: scene.name,
      inputName: input.name,
      inputKind: input.kind,
    });

    await scene.link(obs, {
      setInputSettings: true,
    });

    const { inputSettings } = await obs.call("GetInputSettings", {
      inputName: input.name,
    });

    expect(inputSettings).toEqual(
      expect.objectContaining({
        a: 1,
      })
    );
  });
});

describe("fetchExists", () => {
  it("fails if an input exists with the same name", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await obs.call("CreateScene", {
      sceneName: "Test1",
    });

    await obs.call("CreateInput", {
      sceneName: "Test1",
      inputName: scene.name,
      inputKind: "Test",
    });

    scene.obs = obs;
    await expect(scene.fetchExists()).rejects.toThrow();
  });
});

describe("remove", () => {
  it("removes the scene", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create(obs);
    await scene.remove();

    expect(scene.exists).toBe(false);

    const { scenes } = await obs.call("GetSceneList");
    expect(scenes.length).toBe(0);

    expect(obs.scenes.get(scene.name)).toBeUndefined();
  });

  it("removes scene items", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await scene.create(obs);
    await scene.remove();

    expect(input.itemInstances.size).toBe(0);
    expect(scene.items.length).toBe(0);
  });

  it("removes items of scenes", async () => {
    const nested = new Scene({
      name: "Nested",
      items: {},
    });

    const parent = new Scene({
      name: "Parent",
      items: {
        nested: {
          source: nested,
        },
      },
    });

    await parent.create(obs);
    await parent.remove();

    expect(nested.itemInstances.size).toBe(0);
    expect(parent.items.length).toBe(0);
  });
});

describe("makeCurrentScene", () => {
  it("sets the current program scene", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create(obs);
    await scene.makeCurrentScene();

    const { currentProgramSceneName } = await obs.call(
      "GetCurrentProgramScene"
    );
    expect(currentProgramSceneName).toBe(scene.name);
  });

  it("sets the current preview scene", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create(obs);
    await scene.makeCurrentScene(true);

    const { currentPreviewSceneName } = await obs.call(
      "GetCurrentPreviewScene"
    );
    expect(currentPreviewSceneName).toBe(scene.name);
  });
});

describe("setName", () => {
  it("sets the scene name", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create(obs);

    expect(scene.name).toBe("Test");

    await scene.setName("New Name");
    expect(scene.name).toBe("New Name");
  });

  it("updates refs of items' sources", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    expect(input.refs).toEqual({
      [scene.name]: {
        test: scene.item("test").id,
      },
    });

    await scene.setName("New Name");

    expect(input.refs).toEqual({
      [scene.name]: {
        test: scene.item("test").id,
      },
    });
  });

  it("reports error if source with name already exists", async () => {
    const input = new MockInput({
      name: "Input",
    });

    const scene = new Scene({
      name: "Scene",
      items: {
        test: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    const scene2 = new Scene({
      name: "Scene2",
      items: {
        test: {
          source: input,
        },
      },
    });

    await scene2.create(obs);

    await expect(scene.setName("Input")).rejects.toThrow("Input with name");
    await expect(scene.setName("Scene2")).rejects.toThrow("Scene with name");
  });
});
