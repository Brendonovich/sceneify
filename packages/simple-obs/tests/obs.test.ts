import { Scene, ColorSource, obs } from "../src";

describe("clean()", () => {
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
    expect(scenesAfterClean.find((s) => s.name === scene.name)).toBeUndefined();
  });
});
