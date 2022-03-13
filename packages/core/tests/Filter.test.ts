import { Filter, Scene } from "../src";
import { obs } from "./utils";

describe("setSettings", () => {
  it("sets the filter's settings", async () => {
    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    const scene = await new Scene({
      name: "Scene",
      items: {},
      filters: {
        test: filter,
      },
    }).create(obs);

    await filter.setSettings({
      test: 1,
    });

    const { filterSettings } = await obs.call("GetSourceFilter", {
      sourceName: scene.name,
      filterName: filter.name,
    });

    expect(filterSettings).toEqual({
      test: 1,
    });
  });
});

describe("setEnabled", () => {
  it("sets the filter's enabled state", async () => {
    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    const scene = await new Scene({
      name: "Scene",
      items: {},
      filters: {
        test: filter,
      },
    }).create(obs);

    expect(filter.enabled).toBe(true);

    await filter.setEnabled(false);

    expect(filter.enabled).toBe(false);

    const { filterEnabled } = await obs.call("GetSourceFilter", {
      sourceName: scene.name,
      filterName: filter.name,
    });

    expect(filterEnabled).toBe(false);
  });
});

describe("remove", () => {
  it("removes the filter", async () => {
    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    const scene = await new Scene({
      name: "Scene",
      items: {},
      filters: {
        test: filter,
      },
    }).create(obs);

    expect(scene.filters.length).toBe(1);

    await filter.remove();

    expect(scene.filters.length).toBe(0);
    expect(filter.source).toBeUndefined();

    const { filters } = await obs.call("GetSourceFilterList", {
      sourceName: scene.name,
    });
    expect(filters).toEqual([]);
  });
});

describe("checkSource", () => {
  it("throws an error if source is undefined", async () => {
    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    expect(() => filter.checkSource()).toThrow("does not have a source");
  });
});

describe("create", () => {
  it("adds filters to the source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    await filter.create("test", scene);

    expect(filter.source).toBe(scene);

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

  it("sets settings on existing filters on the source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {
        test: 1,
      },
    });

    await obs.call("CreateSourceFilter", {
      sourceName: scene.name,
      filterName: filter.name,
      filterKind: filter.kind,
      filterSettings: {
        test: 0,
      },
    });

    await filter.create("filter", scene);

    expect(filter.source).toBe(scene);

    const { filters } = await obs.call("GetSourceFilterList", {
      sourceName: scene.name,
    });
    expect(filters).toEqual([
      {
        filterName: filter.name,
        filterEnabled: filter.enabled,
        filterIndex: 0,
        filterKind: filter.kind,
        filterSettings: {
          test: 1,
        },
      },
    ]);
  });

  it("does nothing if filter has already been added to its source", async () => {
    const scene = await new Scene({
      name: "Scene",
      items: {},
    }).create(obs);

    const filter = new Filter({
      name: "Filter",
      kind: "test",
      settings: {},
    });

    await filter.create("test", scene);

    await expect(filter.create("test", scene)).resolves.not.toThrow();
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

    await filter.create("test", scene);

    await expect(filter.create("test", scene2)).rejects.toThrow(
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

    await expect(filter.create("test", scene)).rejects.toThrow(
      "different kind"
    );
  });
});
