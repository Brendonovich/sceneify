import {
  Alignment,
  ColorCorrectionFilter,
  ColorSource,
  obs,
  Scene,
} from "simple-obs";
import {
  Easing,
  keyframe,
  keyframes,
  playTimeline,
} from "simple-obs-animation";

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
          y:400
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
          y: 800
        }
      },
    },
  });
  
  await mainScene.create();
  await mainScene.makeCurrentScene();

  playTimeline({
    0: [
      keyframes(mainScene.items.blue, {
        position: {
          x: 0,
        },
      }),
      keyframes(mainScene.items.red.source.filters.color, {
        hue_shift: 0,
      }),
      keyframes(mainScene.items.red.source, {
        width: keyframe(200, Easing.InOut),
      }),
    ],
    1000: [
      keyframes(mainScene.items.blue, {
        position: {
          x: keyframe(1920, Easing.InOut),
        },
      }),
      keyframes(mainScene.items.red.source.filters.color, {
        hue_shift: 180,
      }),
      keyframes(mainScene.items.red.source, {
        width: keyframe(600, Easing.InOut),
      }),
    ],
    2000: [
      keyframes(mainScene.items.blue, {
        position: {
          x: keyframe(0, Easing.InOut),
        },
      }),
      keyframes(mainScene.items.red.source.filters.color, {
        hue_shift: 0,
      }),
      keyframes(mainScene.items.red.source, {
        width: keyframe(200, Easing.InOut),
      }),
    ],
  });

  await wait(3000);
}

main();

// utility for setTimeout that is nice to use with async/await syntax
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
