import { CustomInputArgs, Input, Scene, SceneItem } from "../src";
import { obs } from "./utils";

/**
 * Exists to safeguard against pre-189101e, where item instances
 * were added inside createSceneItemObject, which isn't great since
 * the same thing needs to be done in overrides as well.
 */
it("adds item instances with createSceneItemObject overridden", async () => {
  class TestInputItem<Input extends TestInput> extends SceneItem<Input> {
    constructor(source: Input, scene: Scene, id: number, ref: string) {
      super(source, scene, id, ref);
    }
  }

  class TestInput extends Input {
    constructor(args: CustomInputArgs<{}, {}>) {
      super({
        kind: "test",
        ...args,
      });
    }

    override createSceneItemObject(
      scene: Scene,
      id: number,
      ref: string
    ): SceneItem<this> {
      return new TestInputItem(this, scene, id, ref);
    }
  }

  const input = new TestInput({
    name: "Input",
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

  expect(input.itemInstances.size).toBe(1);
});
