import { Scene, Input } from "../src";
import { obs } from "./utils";

describe("create()", () => {
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
    expect(scenes.length).toBe(5);
  });

  it("detects existing sources", async () => {
    const existingSource = new Input({
      name: "Existing Source",
      kind: "test",
      settings: {},
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

  it("doesn't duplicate scene items of nested scenes", async () => {
    const testInput = new Input({
      name: "Colour Source",
      kind: "test",
    });

    const linkedScene = new Scene({
      name: "linked",
      items: {
        colour: {
          source: testInput,
        },
      },
    });

    await obs.call("CreateScene", {
      sceneName: linkedScene.name,
    });

    let res = await obs.call("CreateInput", {
      sceneName: linkedScene.name,
      inputName: testInput.name,
      inputKind: testInput.kind,
    });

    await linkedScene.link(obs);

    expect(res.sceneItemId).toBe(linkedScene.item("colour").id);

    const parentScene = new Scene({
      name: "Parent",
      items: {
        linked: {
          source: linkedScene,
        },
      },
    });

    await parentScene.create(obs);

    const { sceneItems } = await obs.call("GetSceneItemList", {
      sceneName: linkedScene.name,
    });

    expect(sceneItems.length).toBe(1);
  });
});
