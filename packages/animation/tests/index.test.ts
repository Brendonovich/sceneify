import { Queue } from "@datastructures-js/queue";
import { ColorSource, Source } from "@simple-obs/core";

import { Keyframe, processTimeline, subjectKeyframes, Easing } from "../src";

describe("processTimeline()", () => {
  beforeEach(() => {
    subjectKeyframes.clear();
  });

  test("Simple", () => {
    let source = new ColorSource({
      name: "Test Source",
    });

    const result = processTimeline({
      subjects: {
        source,
      },
      keyframes: {
        source: {
          width: {
            0: 0,
            1000: 10,
          },
        },
      },
    });

    const widthQueue = result.source.width as Queue<Keyframe>;

    expect(widthQueue.size()).toBe(2);

    expect(widthQueue.dequeue()).toMatchObject({
      beginTimestamp: 0,
      endTimestamp: 0,
      easing: Easing.Linear,
      from: undefined,
      to: 0,
    });

    expect(widthQueue.dequeue()).toMatchObject({
      beginTimestamp: 0,
      endTimestamp: 1000,
      easing: Easing.Linear,
      from: 0,
      to: 10,
    });
  });

  test("Nested", () => {
    class NestedSettingsSource extends Source<{
      property: {
        nested: {
          value: number;
        };
      };
    }> {
      type = "TEST";
    }

    let source = new NestedSettingsSource({
      name: "Test Source",
    });

    const result: any = processTimeline({
      subjects: { source },
      keyframes: {
        source: {
          property: {
            nested: {
              value: {
                0: 0,
                1000: 10,
              },
            },
          },
        },
      },
    });

    const valueQueue = result.source.property.nested.value as Queue<Keyframe>;

    expect(valueQueue.size()).toBe(2);

    expect(valueQueue.dequeue()).toMatchObject({
      beginTimestamp: 0,
      endTimestamp: 0,
      easing: Easing.Linear,
      from: undefined,
      to: 0,
    });

    expect(valueQueue.dequeue()).toMatchObject({
      beginTimestamp: 0,
      endTimestamp: 1000,
      easing: Easing.Linear,
      from: 0,
      to: 10,
    });
  });

  //   test("Parallel subjects", () => {
  //     const source1 = new ColorSource({
  //       name: "Source 1",
  //     });

  //     const source2 = new ColorSource({
  //       name: "Source 2",
  //     });

  //     const result = processTimeline({
  //       subjects: {
  //         source1,
  //         source2,
  //       },
  //       keyframes: {
  //         source1: {
  //           width: {
  //             0: 0,
  //             500: 20,
  //             1000: 10,
  //           },
  //         },
  //         source2: {
  //           height: {
  //             0: 0,
  //             1000: 10,
  //           },
  //         },
  //       },
  //     });

  //     expect(result.source1).toStrictEqual({
  //       width: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 500,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 20,
  //         },
  //         {
  //           beginTimestamp: 500,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 20,
  //           to: 10,
  //         },
  //       ]),
  //     });

  //     expect(result.source2).toStrictEqual({
  //       height: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 10,
  //         },
  //       ]),
  //     });
  //   });

  //   test("Parallel properties", () => {
  //     let source = new ColorSource({
  //       name: "Test Source",
  //     });

  //     const result = processTimeline({
  //       subjects: {
  //         source,
  //       },
  //       keyframes: {
  //         source: {
  //           width: {
  //             0: 0,
  //             1000: 10,
  //           },
  //           height: {
  //             0: 0,
  //             500: 20,
  //             1000: 10,
  //           },
  //         },
  //       },
  //     });

  //     expect(result.source).toStrictEqual({
  //       width: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 10,
  //         },
  //       ]),
  //       height: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 500,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 20,
  //         },
  //         {
  //           beginTimestamp: 500,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 20,
  //           to: 10,
  //         },
  //       ]),
  //     });
  //   });

  //   test("Complex", () => {
  //     const source1 = new ColorSource({
  //       name: "Source 1",
  //     });

  //     const source2 = new ColorSource({
  //       name: "Source 2",
  //     });

  //     const result = processTimeline({
  //       subjects: {
  //         source1,
  //         source2,
  //       },
  //       keyframes: {
  //         source1: {
  //           width: {
  //             0: 0,
  //             500: 10,
  //             800: 40,
  //             1000: 10,
  //           },
  //           height: {
  //             0: 0,
  //             500: 20,
  //             1000: 10,
  //           },
  //         },
  //         source2: {
  //           width: {
  //             0: 0,
  //             300: 50,
  //             800: 30,
  //             1000: 20,
  //           },
  //           height: {
  //             0: 0,
  //             500: 35,
  //             1000: 20,
  //           },
  //         },
  //       },
  //     });

  //     expect(result.source1).toStrictEqual({
  //       width: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 500,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 10,
  //         },
  //         {
  //           beginTimestamp: 500,
  //           endTimestamp: 800,
  //           easing: Easing.Linear,
  //           from: 10,
  //           to: 40,
  //         },
  //         {
  //           beginTimestamp: 800,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 40,
  //           to: 10,
  //         },
  //       ]),
  //       height: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 500,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 20,
  //         },
  //         {
  //           beginTimestamp: 500,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 20,
  //           to: 10,
  //         },
  //       ]),
  //     });

  //     expect(result.source2).toStrictEqual({
  //       width: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 300,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 50,
  //         },
  //         {
  //           beginTimestamp: 300,
  //           endTimestamp: 800,
  //           easing: Easing.Linear,
  //           from: 50,
  //           to: 30,
  //         },
  //         {
  //           beginTimestamp: 800,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 30,
  //           to: 20,
  //         },
  //       ]),
  //       height: new Queue<Keyframe>([
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 0,
  //           easing: Easing.Linear,
  //           from: undefined,
  //           to: 0,
  //         },
  //         {
  //           beginTimestamp: 0,
  //           endTimestamp: 500,
  //           easing: Easing.Linear,
  //           from: 0,
  //           to: 35,
  //         },
  //         {
  //           beginTimestamp: 500,
  //           endTimestamp: 1000,
  //           easing: Easing.Linear,
  //           from: 35,
  //           to: 20,
  //         },
  //       ]),
  //     });
  //   });
});
