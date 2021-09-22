import {
  ColorSource,
  Scene,
  SceneItem,
  DEFAULT_SCENE_ITEM_PROPERTIES,
  SceneItemProperties,
} from "simple-obs";
import { keyframes, playTimeline, subjectKeyframes } from "../src";

let source = new ColorSource({
  name: "bruh",
});

let a = new Scene({
  name: "test",
  items: {
    a: {
      source,
    },
  },
});

test("do thing", () => {
  playTimeline({
    0: [
      keyframes(source, {
        color: 0,
        width: 0,
        height: 0,
      }),
    ],
    1000: [keyframes(a.items.a, {})],
  });

  console.log(subjectKeyframes.get(source)!.color);
});
