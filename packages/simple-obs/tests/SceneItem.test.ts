import { Scene, ColorSource, obs } from "../src";

describe("setProperties()", () => {
  it("updates obs properties", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new ColorSource({
            name: "Source",
            settings: {},
          }),
        },
      },
    });

    await scene.create();

    const item = scene.items.item;

    expect(item.properties.rotation).toBe(0);
    expect(item.properties.position.x).toBe(0);

    await item.setProperties({
      rotation: 10,
      position: {
        x: 10,
      },
    });

    const obsProperties = await obs.getSceneItemProperties({
      scene: scene.name,
      id: item.id,
    });

    expect(item.properties.rotation).toBe(10);
    expect(item.properties.position.x).toBe(10);

    expect(obsProperties.rotation).toBe(10);
    expect(obsProperties.position.x).toBe(10);
  });

  it("ignores undefined values", async () => {
    const scene = new Scene({
      name: "Test1",
      items: {
        item: {
          source: new ColorSource({
            name: "Source",
            settings: {},
          }),
        },
      },
    });

    await scene.create();

    const item = scene.items.item;

    expect(item.properties.rotation).toBe(0);
    expect(item.properties.position.x).toBe(0);
    expect(item.properties.position.y).toBe(0);

    await item.setProperties({
      rotation: undefined,
      position: {
        x: 10,
        y: undefined,
      },
    });

    const obsProperties = await obs.getSceneItemProperties({
      scene: scene.name,
      id: item.id,
    });

    expect(item.properties.rotation).toBe(0);
    expect(item.properties.position.x).toBe(10);
    expect(item.properties.position.y).toBe(0);

    expect(obsProperties.rotation).toBe(0);
    expect(obsProperties.position.x).toBe(10);
    expect(obsProperties.position.y).toBe(0);
  });
});
