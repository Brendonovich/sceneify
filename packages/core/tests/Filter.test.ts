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
