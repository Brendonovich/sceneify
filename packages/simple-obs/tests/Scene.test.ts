import { Scene, obs, ColorSource } from "../src";
 
describe("create()", () => {
  it("creates new scenes", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await scene.create();
 
    expect(scene.initalized).toBe(true);
    expect(scene.exists).toBe(true);

    const obsScenes = await obs.getSceneList();
    expect(
      obsScenes.scenes.find((s) => s.name === scene.name)
    ).not.toBeUndefined();
  });

  it("detects existing scenes", async () => {
    const scene = new Scene({
      name: "Test",
      items: {},
    });

    await obs.createScene(scene.name);

    await scene.create();

    expect(scene.initalized).toBe(true); 
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

    await parent.create();

    expect(nested1.create).toHaveBeenCalled();
    expect(nested2.create).toHaveBeenCalled();
    expect(nested3.create).toHaveBeenCalled();

    const { scenes } = await obs.getSceneList();
    expect(scenes.length).toBe(5);
  });

  it("detects existing sources", async () => {
    const existingSource = new ColorSource({
      name: "Existing Source",
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

    await tempScene.create();

    const mainScene = new Scene({
      name: "Main",
      items: {
        existing: {
          source: existingSource,
        },
      },
    });

    await mainScene.create();

    expect(mainScene.items.existing.source).toBe(
      tempScene.items.existing.source
    );
    expect(existingSource.itemInstances.size).toBe(2);
  });
});
