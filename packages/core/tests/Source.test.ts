import { Filter, Input, Scene } from "../src";
import { obs, resetSceneify } from "./utils";

describe("createSceneItem", () => {
  it("fails if source is not initialized", async () => {
    const input = new Input({
      kind: "test",
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
    const existingInput = new Input({
      kind: "test",
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

    const input = new Input({
      kind: "test",
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
    const existingInput = new Input({
      kind: "test",
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

    const input = new Input({
      kind: "test",
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

    const input = new Input({
      kind: "test",
      name: "Input",
      filters: {
        test: new Filter({
          name: "Filter",
          kind: "test",
          settings: {},
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

describe("addFilter", () => {
  it("adds filters to the source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    await scene.addFilter(
      "test",
      new Filter({
        name: "Filter",
        kind: "test",
        settings: {},
      })
    );

    const filter = scene.filter("test")!;

    expect(filter.source).toBe(scene);
    expect(scene.filters.length).toBe(1);

    const { filters } = await obs.call("GetSourceFilterList", {
      sourceName: scene.name,
    });
    expect(filters).toEqual([
      {
        filterName: filter.name,
        filterEnabled: filter.enabled,
        filterIndex: 0,
        filterKind: filter.kind,
        filterSettings: filter.settings,
      },
    ]);
  });

  it("detects existing filters on the source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    await obs.call("CreateSourceFilter", {
      sourceName: scene.name,
      filterName: filter.name,
      filterKind: filter.kind,
    });

    await scene.addFilter("filter", filter);

    expect(filter.source).toBe(scene);
    expect(scene.filters.length).toBe(1);

    const { filters } = await obs.call("GetSourceFilterList", {
      sourceName: scene.name,
    });
    expect(filters).toEqual([
      {
        filterName: filter.name,
        filterEnabled: filter.enabled,
        filterIndex: 0,
        filterKind: filter.kind,
        filterSettings: filter.settings,
      },
    ]);
  });

  it("fails if filter has already been added to a source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const scene2 = await new Scene({
      name: "Scene2",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    await scene.addFilter("test", filter);

    await expect(scene2.addFilter("test", filter)).rejects.toThrow(
      "already been added"
    );
  });

  it("fails if filter with the same name exists with a different type", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    await obs.call("CreateSourceFilter", {
      sourceName: scene.name,
      filterName: filter.name,
      filterKind: "anotherKind",
    });

    await expect(scene.addFilter("test", filter)).rejects.toThrow(
      "different kind"
    );
  });
});
