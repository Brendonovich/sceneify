import { Source, OBS, Scene } from "../src";
import { MockOBSWebSocket } from "./mocks/OBSWebSocket";

let obs = new OBS();

beforeEach(() => {
  obs.socket = new MockOBSWebSocket() as any;
});

describe("clean()", () => {
  it("removes scenes from OBS", async () => {
    const scene = new Scene({
      name: "Test",
      items: {
        item: {
          source: new Source({
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

    obs.sources.clear();
    obs.scenes.clear();

    await obs.clean();

    const { scenes: scenesAfterClean } = await obs.call("GetSceneList");
    expect(
      scenesAfterClean.find(({ sceneName }) => sceneName === scene.name)
    ).toBeUndefined();
  });
});
