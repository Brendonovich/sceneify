import { obs, Scene, ColorSource } from "../src";

beforeEach(async () => {
  await obs.connect({ address: "localhost:4444" });
});

afterEach(async () => {
  obs.clear();
  await obs.clean();

  obs.disconnect();
});

describe("Scene", () => {
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
});

describe("obs", () => {
  describe("clean", () => {
    it("removes scenes from OBS", async () => {
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

      const { scenes: scenesBeforeClean } = await obs.getSceneList();
      expect(
        scenesBeforeClean.find((s) => s.name === scene.name)
      ).not.toBeUndefined();

      obs.clear();
      await obs.clean();

      const { scenes: scenesAfterClean } = await obs.getSceneList();
      expect(
        scenesAfterClean.find((s) => s.name === scene.name)
      ).toBeUndefined();
    });
  });
});

describe("SceneItem", () => {
  describe("setProperties", () => {
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
});
