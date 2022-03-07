import { Input, OBS, Scene } from "../src";
import { MockOBSWebSocket } from "./mocks/OBSWebSocket";

let obs = new OBS();

beforeEach(() => {
  obs.socket = new MockOBSWebSocket() as any;
});

describe("clean()", () => {
  it("removes spare scenes from OBS", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new Input({
            name: "Source",
            kind: "test",
            settings: {},
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

  it("removes leftover scene objects from OBS instance", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new Input({
            name: "Source",
            kind: "test",
            settings: {},
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

  it("doesn't remove linked scenes", async () => {
    const sceneName = "Test";

    await obs.call("CreateScene", {
      sceneName,
    });

    const { sceneItemId } = await obs.call("CreateInput", {
      sceneName,
      inputName: "Test Input",
      inputKind: "test",
    });

    const { scenes: scenesBeforeClean } = await obs.call("GetSceneList");
    expect(scenesBeforeClean.length).toBe(2);

    const scene = new Scene({
      name: sceneName,
      items: {
        item: {
          source: new Input({
            name: "Test Input",
            kind: "test",
          }),
        },
      },
    });

    await scene.link(obs);

    expect(obs.scenes.size).toBe(1);

    await obs.clean();

    const { scenes: scenesAfterClean } = await obs.call("GetSceneList");

    expect(scenesAfterClean.length).toBe(2);
    expect(scene.item("item").id).toBe(sceneItemId);
  });
});
