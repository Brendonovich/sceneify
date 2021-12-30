import { ColorSource, OBS, Scene } from "../src";
import { MockOBSWebSocket } from "./mocks/OBSWebSocket";

let obs = new OBS();

beforeEach(() => {
  obs.socket = new MockOBSWebSocket();
});

describe("create()", () => {
  it("creates new scenes", async () => {
    // const scene = new Scene({
    //   name: "Test",
    //   items: {},
    // });

    const scene = new Scene("Test", {});

    await scene.create(obs);

    expect(scene.initalized).toBe(true);
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

    await parent.create(obs);

    expect(nested1.create).toHaveBeenCalled();
    expect(nested2.create).toHaveBeenCalled();
    expect(nested3.create).toHaveBeenCalled();

    const { scenes } = await obs.call("GetSceneList");
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
});
