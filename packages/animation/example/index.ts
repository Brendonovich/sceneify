import {
  Alignment,
  ColorCorrectionFilter,
  ColorSource,
  obs,
  Scene,
} from "@simple-obs/core";
import { Easing, keyframe, animate } from "@simple-obs/animation";

async function main() {
  await obs.connect({ address: "localhost:4444" });

  const mainScene = new Scene({
    name: "Main",
    items: {
      blue: {
        source: new ColorSource({
          name: "Blue Color Source",
          settings: {
            color: 0xffff0000,
            width: 400,
            height: 400,
          },
        }),
        position: {
          alignment: Alignment.Center,
          y: 400,
        },
      },
      red: {
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
          y: 800,
        },
      },
    },
  });

  await mainScene.create();
  await mainScene.makeCurrentScene();

  await animate({
    subjects: {
      blueItem: mainScene.items.blue,
      redColorFilter: mainScene.items.red.source.filters.color,
      redSource: mainScene.items.red.source,
    },
    keyframes: {
      blueItem: {
        position: {
          x: {
            // Keyframe values can be passed as simple values and use default easing
            0: 0,
            // Or can be passed with custom easing values (+ more data in the future)
            1000: keyframe(1920, Easing.InOut),
            2000: keyframe(0, Easing.InOut),
          },
        },
      },
      redColorFilter: {
        hue_shift: {
          0: 0,
          1000: 180,
          2000: 0,
        },
      },
      redSource: {
        width: {
          0: keyframe(200, Easing.InOut),
          1000: keyframe(600, Easing.InOut),
          2000: keyframe(200, Easing.InOut),
        },
      },
    },
  });
}

main();

// utility for setTimeout that is nice to use with async/await syntax
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
