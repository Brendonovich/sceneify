import { Scene, Input } from "../src";
import { obs } from "./utils";

describe("setTransform", () => {
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

    item.source.setSettings({});

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

describe("setEnabled", () => {
  it("sets item's enabled state", async () => {
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

    expect(item.enabled).toBe(true);

    await item.setEnabled(false);

    expect(item.enabled).toBe(false);
  });
});

describe("setLocked", () => {
  it("sets item's locked state", async () => {
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

    expect(item.locked).toBe(false);

    await item.setLocked(true);

    expect(item.locked).toBe(true);
  });
});

describe("remove", () => {
  it("removes item from scene", async () => {
    const input = new Input({
      kind: "test",
      name: "Source",
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
    await scene.item("item").remove();

    expect(scene.item("item")).toBeUndefined();
  });

  it("removes item ref", async () => {
    let input = new Input({
      kind: "test",
      name: "Source",
    });

    const scene = new Scene({
      name: "Test",
      items: {
        item1: {
          source: input,
        },
        item2: {
          source: input,
        },
      },
    });

    await scene.create(obs);

    expect(input.refs).toEqual({
      [scene.name]: {
        [scene.item("item1").ref]: scene.item("item1").id,
        [scene.item("item2").ref]: scene.item("item2").id,
      },
    });

    await scene.item("item1").remove();

    expect(input.refs).toEqual({
      [scene.name]: {
        [scene.item("item2").ref]: scene.item("item2").id,
      },
    });
  });
});
