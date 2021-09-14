import {
  Alignment,
  ColorCorrectionFilter,
  ColorSource,
  obs,
  Scene,
} from "simple-obs";

// README
// Running this code requies that you create a scene named "Linked Scene" with a single
// color source inside it names "Linked Color Source", otherwise the linking example
// will cause the script to throw an error

async function main() {
  // Connect to OBS before creating or linking any scenes
  await obs.connect({ address: "localhost:4444" });

  // The underlying websocket is exposed through helper functions and the `obs.socket` object
  const { baseWidth: OBS_WIDTH, baseHeight: OBS_HEIGHT } =
    await obs.getVideoInfo();

  // Sources are just classes, and can be declared anywhere
  const blueColorSource = new ColorSource({
    name: "Blue Color Source",
    settings: {
      color: 0xffff0000,
    },
  });

  // Scenes are also just classes, only functioning  as a schema at first
  const mainScene = new Scene({
    name: "Main",
    items: {
      blue: {
        source: blueColorSource,
      },
      red: {
        // As mentioned above, sources can be declared anywhere, whether inside or outside a scene schema
        source: new ColorSource({
          name: "Main Scene Background",
          settings: {
            color: 0xff0000ff,
            width: 200,
            height: 200,
          },
          filters: {
            color: new ColorCorrectionFilter({
              name: "Color",
              settings: {
                hue_shift: 0,
              },
            }),
          },
        }),
        position: {
          alignment: Alignment.Center,
          x: OBS_WIDTH / 2,
          y: OBS_HEIGHT / 2,
        },
      },
    },
  });

  // Once Scene.create() is called, mainScene and its items can be used however you like.
  await mainScene.create();
  await mainScene.makeCurrentScene();

  await wait(1000);

  // Color should change from red to green after 1 second
  await mainScene.items.red.source.setSettings({
    color: 0xff00ff00,
  });

  await wait(5000);

  const linkedScene = new Scene({
    name: "Linked Scene",
    items: {
      color: {
        source: new ColorSource({
          name: "Linked Color Source",
        }),
        position: {
          alignment: Alignment.TopLeft,
          x: 0,
          y: 0,
        },
      },
    },
  });

  // Alternatively to Scene.create(), you can call Scene.link(), which will attempt to match the schema
  // of the scene you call it on to an existing scene and its items in OBS.
  // When linking, you can choose whether to force the linked items to have their properties and/or
  // settings set to the values you have defined in your schema. You'll probably want these to be true
  // if your schema contains custom property or setting values.
  await linkedScene.link({
    setProperties: true,
  });

  // After linking, you can interact with the items you declared in the schema in the same way
  // you would after calling Scene.create()
  await linkedScene.makeCurrentScene();

  await wait(1000);

  // Color source should move from top left to bottom right after 1 second
  await linkedScene.items.color.setProperties({
    position: {
      alignment: Alignment.BottomRight,
      x: OBS_WIDTH,
      y: OBS_HEIGHT,
    },
  });
}

main();

// utility for setTimeout that is nice to use with async/await syntax
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
