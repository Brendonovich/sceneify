import {
  Alignment,
  OBSSocket,
  Scene,
  Sceneify,
  Input,
} from "@sceneify/core-rewrite";
import {
  ColorSource,
  ColorCorrectionFilter,
  MacOSScreenCapture,
} from "@sceneify/sources";
import { Effect } from "effect";

// README
// Running this code requies that you create a scene named "Linked Scene" with a single
// color source inside it names "Linked Color Source", otherwise the linking example
// will cause the script to throw an error

const program = Effect.gen(function* () {
  const obs = yield* OBSSocket.OBSSocket;
  // verifies that the required linked scene exists
  // await verifyLinkedSceneExists(obs);

  // Requests can be made directly through the websocket using OBS.call
  const { baseWidth: OBS_WIDTH, baseHeight: OBS_HEIGHT } = yield* obs.call(
    "GetVideoSettings"
  );

  // Sources are just classes, and can be declared anywhere
  const color = Input.declare(ColorSource, {
    name: "Color Source",
    settings: {
      color: 0xffff0000,
      width: 400,
      height: 400,
    },
    filters: {
      color: {
        type: ColorCorrectionFilter,
        name: "Color Corrector",
        settings: {
          brightness: 0,
          hue_shift: 0,
        },
      },
    },
  });

  const display = Input.declare(MacOSScreenCapture, {
    name: "Display",
  });

  // Scenes are just classes, only functioning  as a schema at first
  const mainScene = Scene.declare({
    name: "Main",
    items: {
      red: {
        source: color,
        transform: {
          alignment: Alignment.center,
          positionX: OBS_WIDTH / 2,
          positionY: OBS_HEIGHT / 2,
        },
      },
      display: {
        source: display,
        enabled: false,
      },
    },
  });

  // Once Scene.create() is called, mainScene and its items can be used however you like.
  const scene = yield* Scene.sync(mainScene);
  yield* scene.makeProgramScene;

  yield* Effect.sleep("1 second");

  // Color should change from red to green
  yield* scene.item("red").input.setSettings({
    color: 0xff00ff00,
  });

  yield* Effect.sleep("1 second");

  // Color should change from green to pink
  yield* scene.item("red").input.filter("color").setSettings({
    hue_shift: 180,
  });

  yield* Effect.sleep("3 second");

  // const linkedScene = new Scene({
  //   name: "Linked Scene",
  //   items: {
  //     color: {
  //       source: new ColorSource({
  //         name: "Linked Color Source",
  //       }),
  //       alignment: Alignment.TopLeft,
  //       positionX: 0,
  //       positionY: 0,
  //     },
  //   },
  // });

  // Alternatively to Scene.create(), you can call Scene.link(), which will attempt to match the schema
  // of the scene you call it on to an existing scene and its items in OBS.
  // When linking, you can choose whether to force the linked items to have their properties and/or
  // settings set to the values you have defined in your schema. You'll probably want these to be true
  // if your schema contains custom property or setting values.
  // await linkedScene.link(obs, {
  // setTransform: true,
  // });

  // After linking, you can interact with the items you declared in the schema in the same way
  // you would after calling Scene.create()
  // await linkedScene.makeCurrentScene();

  // await wait(1000);

  // Color source should move from top left to bottom right after 1 second
  // await linkedScene.item("color").setTransform({
  //   alignment: Alignment.BottomRight,
  //   positionX: OBS_WIDTH,
  //   positionY: OBS_HEIGHT,
  // });

  // await wait(3000);

  // Scenes are sources, and can be used as such!
  // const finalSceen = new Scene({
  //   name: "Final Scene",
  //   items: {
  //     main: {
  //       source: mainScene,
  //       positionX: OBS_WIDTH / 2,
  //       positionY: OBS_HEIGHT / 2,
  //       alignment: Alignment.Center,
  //       scaleX: 1,
  //       scaleY: 1,
  //     },
  //     linked: {
  //       source: linkedScene,
  //     },
  //   },
  // });

  // await finalSceen.create(obs);
  // await finalSceen.makeCurrentScene();

  // await wait(1000);

  // Operation performed on the 'main' item of 'Final Scene', not the main scene itself
  // await finalSceen.item("main").setTransform({
  //   scaleX: 0.5,
  //   scaleY: 0.5,
  // });
});

program.pipe(
  Effect.provide(OBSSocket.layer({ url: "ws:localhost:4455" })),
  Effect.provide(Sceneify.layer),
  Effect.runPromise
);

// utility for setTimeout that is nice to use with async/await syntax
// const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// async function verifyLinkedSceneExists(obs: OBS) {
//   const { scenes } = await obs.call("GetSceneList");

//   if (!scenes.some((s) => s.sceneName === "Linked Scene")) {
//     throw new Error("Linked Scene does not exist. Please create it.");
//   }

//   const { sceneItems } = await obs.call("GetSceneItemList", {
//     sceneName: "Linked Scene",
//   });

//   if (!sceneItems.some((i) => i.sourceName === "Linked Color Source")) {
//     throw new Error(
//       "Linked Color Source does not exist. Please create it inside Linked Scene."
//     );
//   }
// }
