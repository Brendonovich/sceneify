import { Scene, OBS, Input } from "../src";
import { MockOBSWebSocket } from "./mocks/OBSWebSocket";

let obs = new OBS();

beforeEach(() => {
  obs.socket = new MockOBSWebSocket() as any;
});

describe("setTransform()", () => {
  it("updates obs transform", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new Input({
            kind: "test",
            name: "Source",
            settings: {},
          }),
        },
      },
    });

    await scene.create(obs);

    const item = scene.item("item");

    expect(item.transform.rotation).toBe(0);
    expect(item.transform.positionX).toBe(0);

    await item.setTransform({
      rotation: 10,
      positionX: 10,
    });

    const { sceneItemTransform } = await obs.call("GetSceneItemTransform", {
      sceneName: scene.name,
      sceneItemId: item.id,
    });

    expect(item.transform.rotation).toBe(10);
    expect(item.transform.positionX).toBe(10);

    expect(sceneItemTransform.rotation).toBe(10);
    expect(sceneItemTransform.positionX).toBe(10);
  });

  it("ignores undefined values", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new Input({
            kind: "test",
            name: "Source",
            settings: {},
          }),
        },
      },
    });

    await scene.create(obs);

    const item = scene.item("item");

    expect(item.transform.rotation).toBe(0);
    expect(item.transform.positionX).toBe(0);
    expect(item.transform.positionY).toBe(0);

    await item.setTransform({
      rotation: undefined,
      positionX: 10,
      positionY: undefined,
    });

    const { sceneItemTransform } = await obs.call("GetSceneItemTransform", {
      sceneName: scene.name,
      sceneItemId: item.id,
    });

    expect(item.transform.rotation).toBe(0);
    expect(item.transform.positionX).toBe(10);
    expect(item.transform.positionY).toBe(0);

    expect(sceneItemTransform.rotation).toBe(0);
    expect(sceneItemTransform.positionX).toBe(10);
    expect(sceneItemTransform.positionY).toBe(0);
  });
});
