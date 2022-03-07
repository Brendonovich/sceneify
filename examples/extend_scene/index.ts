import {
  Scene,
  Alignment,
  SceneItem,
  SourceFilters,
  OBS,
} from "@sceneify/core";
import { ImageSource } from "@sceneify/sources";

export class WindowItem<W extends Window> extends SceneItem<W> {
  constructor(source: W, scene: Scene, id: number, ref: string) {
    super(source, scene, id, ref);
  }
}

interface Args<TContentScene extends Scene, Filters extends SourceFilters> {
  name: string;
  contentScene: TContentScene;
  boundsItem: TContentScene extends Scene<infer I> ? keyof I : never;
  icon: ImageSource;
  filters?: Filters;
}

class Window<
  TContentScene extends Scene = any,
  Filters extends SourceFilters = SourceFilters
> extends Scene<{}, Filters> {
  constructor({ name, filters }: Args<TContentScene, Filters>) {
    super({
      name: `${name} Window`,
      items: {},
      filters,
    });
  }

  createSceneItemObject(
    scene: Scene,
    id: number,
    ref: string
  ): WindowItem<this> {
    return new WindowItem(this, scene, id, ref);
  }
}

async function main() {
  const obs = new OBS();

  // Connect to OBS before creating or linking any scenes
  await obs.connect("ws:localhost:4455");

  let a = new Window({
    name: "A",
    contentScene: new Scene({
      name: "A Content",
      items: {
        test: {
          source: new ImageSource({
            name: "Test",
          }),
        },
      },
    }),
    icon: new ImageSource({
      name: "A Icon",
    }),
    boundsItem: "test",
  });

  let scene = new Scene({
    name: "test",
    items: {
      window: {
        source: a,
      },
    },
  });

  let item = await scene.createItem("test", {
    source: a,
  });
}

main();
