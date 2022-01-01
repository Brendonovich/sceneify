import { Alignment, OBS, Scene } from "@simple-obs/core";
import { ColorCorrectionFilter } from "@simple-obs/filters";
import { ColorSource } from "@simple-obs/sources";

// README
// Running this code requies that you create a scene named "Linked Scene" with a single
// color source inside it names "Linked Color Source", otherwise the linking example
// will cause the script to throw an error

async function main() {
  const obs = new OBS();

  // Connect to OBS before creating or linking any scenes
  await obs.connect("ws:localhost:4444");

  // Requests can be made directly through the websocket using OBS.call
  const { baseWidth: OBS_WIDTH, baseHeight: OBS_HEIGHT } = await obs.call(
    "GetVideoSettings"
  );

  // Sources are just classes, and can be declared anywhere
  const color = new ColorSource({
    name: "Color Source",
    settings: {
      color: 0xffff0000,
      width: 400,
      height: 400,
    },
    filters: {
      // color: new ColorCorrectionFilter({
      //   name: "Color Corrector",
      //   settings: {
      //     brightness: 0,
      //     hue_shift: 0,
      //   },
      // }),
    },
  });

  // Scenes are just classes, only functioning  as a schema at first
  const mainScene = new Scene({
    name: "Main",
    items: {
      red: {
        source: color,
        alignment: Alignment.Center,
        positionX: OBS_WIDTH / 2,
        positionY: OBS_HEIGHT / 2,
      },
    },
  });

  // Once Scene.create() is called, mainScene and its items can be used however you like.
  await mainScene.create(obs);
  await mainScene.makeCurrentScene();

  await wait(1000);

  // Color should change from red to green after 1 second
  await mainScene.item("red").source.setSettings({
    color: 0xff00ff00,
  });

  await wait(1000);

  // Color should change from green to pink
  // await mainScene.item("red").source.filter("color").setSettings({
  //   hue_shift: 180,
  // });

  await wait(3000);

  const linkedScene = new Scene({
    name: "Linked Scene",
    items: {
      color: {
        source: new ColorSource({
          name: "Linked Color Source",
        }),
        alignment: Alignment.TopLeft,
        positionX: 0,
        positionY: 0,
      },
    },
  });

  // Alternatively to Scene.create(), you can call Scene.link(), which will attempt to match the schema
  // of the scene you call it on to an existing scene and its items in OBS.
  // When linking, you can choose whether to force the linked items to have their properties and/or
  // settings set to the values you have defined in your schema. You'll probably want these to be true
  // if your schema contains custom property or setting values.
  await linkedScene.link(obs, {
    setProperties: true,
  });

  // After linking, you can interact with the items you declared in the schema in the same way
  // you would after calling Scene.create()
  await linkedScene.makeCurrentScene();

  await wait(1000);

  // Color source should move from top left to bottom right after 1 second
  await linkedScene.item("color").setTransform({
    alignment: Alignment.BottomRight,
    positionX: OBS_WIDTH,
    positionY: OBS_HEIGHT,
  });

  await wait(3000);

  // Scenes are sources, and can be used as such!
  const finalSceen = new Scene({
    name: "Final Scene",
    items: {
      main: {
        source: mainScene,
        positionX: OBS_WIDTH / 2,
        positionY: OBS_HEIGHT / 2,
        alignment: Alignment.Center,
        scaleX: 1,
        scaleY: 1,
      },
      linked: {
        source: linkedScene,
      },
    },
  });

  await finalSceen.create(obs);
  await finalSceen.makeCurrentScene();

  await wait(1000);

  // Operation performed on the 'main' item of 'Final Scene', not the main scene itself
  await finalSceen.item("main").setTransform({
    scaleX: 0.5,
    scaleY: 0.5,
  });
}

main();

// utility for setTimeout that is nice to use with async/await syntax
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
