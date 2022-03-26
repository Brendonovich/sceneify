import { OBS, Scene, SceneItem } from "@sceneify/core";
import {
  animate,
  filterAnimate as pluginAnimate,
  keyframes,
} from "@sceneify/animation";
import { ColorSource } from "@sceneify/sources";
import { ColorCorrectionFilter } from "@sceneify/filters";

async function main() {
  const obs = new OBS();

  await obs.connect("ws:localhost:4455");

  const mainScene = new Scene({
    name: "Main",
    items: {},
  });

  await mainScene.create(obs);

  const items: SceneItem[] = [];

  const ITEM_COUNT = 100;

  const SPEED = 500;
  const WIDTH = 1900;
  const HEIGHT = 1060;

  const LAP_TIME = (1000 * (2 * (WIDTH + HEIGHT))) / SPEED;

  for (const i of [...Array(ITEM_COUNT).keys()])
    items.push(
      await mainScene.createItem(`${i}`, {
        source: new ColorSource({
          name: `Blue Color Source ${i}`,
          settings: {
            color: 0xffff0000,
            width: 20,
            height: 20,
          },
          filters: {
            colorCorrection: new ColorCorrectionFilter({
              name: `Color Correction`,
              settings: {
                hue_shift: 0,
              },
            }),
          },
        }),
        positionY: 0,
        positionX: 0,
      })
    );

  await mainScene.makeCurrentScene();
  await obs.clean();
  const kfs = items.reduce((acc, item, index) => {
    const OFFSET = index * 100;
    return [
      ...acc,
      keyframes(item, {
        positionX: {
          [OFFSET]: 0,
          [OFFSET + (1000 * WIDTH) / SPEED]: WIDTH,
          [OFFSET + (1000 * (WIDTH + HEIGHT)) / SPEED]: WIDTH,
          [OFFSET + (1000 * (2 * WIDTH + HEIGHT)) / SPEED]: 0,
        },
        positionY: {
          [OFFSET]: 0,
          [OFFSET + (1000 * WIDTH) / SPEED]: 0,
          [OFFSET + (1000 * (WIDTH + HEIGHT)) / SPEED]: 1080 - 20,
          [OFFSET + (1000 * (2 * WIDTH + HEIGHT)) / SPEED]: 1080 - 20,
          [OFFSET + (1000 * (2 * WIDTH + HEIGHT)) / SPEED]: 0,
        },
      }),
      keyframes(item.source.filter("colorCorrection")!, {
        hue_shift: {
          [OFFSET]: 0,
          [OFFSET + LAP_TIME]: 360,
        },
      }),
    ];
  }, [] as any[]);

  pluginAnimate(kfs);

  // items.map((item, index) => {
  //   setTimeout(
  //     () =>
  //       setInterval(
  //         () =>
  //           animate({
  //             subjects: {
  //               item,
  //               filter: item.source.filter("colorCorrection")!,
  //             },
  //             keyframes: {
  //               item: {
  //                 positionX: {
  //                   0: 0,
  //                   1000: 1920 - 10,
  //                   2000: 1920 - 10,
  //                   3000: 0,
  //                 },
  //                 positionY: {
  //                   0: 0,
  //                   1000: 0,
  //                   2000: 1080 - 10,
  //                   3000: 1080 - 10,
  //                   4000: 0,
  //                 },
  //               },
  //               filter: {
  //                 hue_shift: {
  //                   0: 0,
  //                   4000: 360,
  //                 },
  //               },
  //             },
  //           }),
  //         4050
  //       ),
  //     4050 * (index / ITEM_COUNT)
  //   );
  // });

  // await mainScene.create(obs);
  // await mainScene.makeCurrentScene();

  // await animate({
  //   subjects: {
  //     blueItem: mainScene.item("blue"),
  //     // redColorFilter: mainScene.items.red.source.filters.color,
  //     redSource: mainScene.item("red").source,
  //   },
  //   keyframes: {
  //     blueItem: {
  //       positionX: {
  //         // Keyframe values can be passed as simple values and use default easing
  //         0: 0,
  //         // Or can be passed with custom easing values (+ more data in the future)
  //         1000: keyframe(1920, Easing.InOut),
  //         2000: keyframe(0, Easing.InOut),
  //       },
  //     },
  //     // redColorFilter: {
  //     //   hue_shift: {
  //     //     0: 0,
  //     //     1000: 180,
  //     //     2000: 0,
  //     //   },
  //     // },
  //     redSource: {
  //       width: {
  //         0: keyframe(200, Easing.InOut),
  //         1000: keyframe(600, Easing.InOut),
  //         2000: keyframe(200, Easing.InOut),
  //       },
  //     },
  //   },
  // });
}

main();

// utility for setTimeout that is nice to use with async/await syntax
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
