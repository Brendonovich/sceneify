import { Queue } from "@datastructures-js/queue";
import { ColorSource } from "simple-obs";
import {
  keyframes,
  Keyframe,
  processTimeline,
  subjectKeyframes,
  Easing,
  keyframe,
} from "../src";

describe("Timeline processing", () => {
  beforeEach(() => {
    subjectKeyframes.clear();
  });
  
  test("Simple", () => {
    let source = new ColorSource({
      name: "Test Source",
    });

    processTimeline(
      {
        0: [
          keyframes(source, {
            width: 0,
          }),
        ],
        1000: [
          keyframes(source, {
            width: 10,
          }),
        ],
      },
      0
    );

    expect(subjectKeyframes.get(source)).toStrictEqual({
      width: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 0,
          to: 10,
        },
      ]),
    });
  });

  test("Nested", () => {
    let source = new ColorSource({
      name: "Test Source",
    });

    processTimeline(
      {
        0: [
          keyframes(source as any, {
            property: {
              nested: {
                value: keyframe(0, Easing.Linear),
              },
            },
          }),
        ],
        1000: [
          keyframes(source as any, {
            property: {
              nested: {
                value: keyframe(10, Easing.Linear),
              },
            },
          }),
        ],
      },
      0
    );

    expect(subjectKeyframes.get(source)).toStrictEqual({
      property: {
        nested: {
          value: new Queue<Keyframe>([
            {
              beginTimestamp: 0,
              endTimestamp: 0,
              easing: Easing.Linear,
              from: undefined,
              to: 0,
            },
            {
              beginTimestamp: 0,
              endTimestamp: 1000,
              easing: Easing.Linear,
              from: 0,
              to: 10,
            },
          ]),
        },
      },
    });
  });

  test("Parallel subjects", () => {
    const source1 = new ColorSource({
      name: "Source 1",
    });

    const source2 = new ColorSource({
      name: "Source 2",
    });

    processTimeline(
      {
        0: [
          keyframes(source1, {
            width: 0,
          }),
          keyframes(source2, {
            height: 0,
          }),
        ],
        500: [
          keyframes(source1, {
            width: 20,
          }),
        ],
        1000: [
          keyframes(source1, {
            width: 10,
          }),
          keyframes(source2, {
            height: 10,
          }),
        ],
      },
      0
    );

    expect(subjectKeyframes.get(source1)).toStrictEqual({
      width: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 500,
          easing: Easing.Linear,
          from: 0,
          to: 20,
        },
        {
          beginTimestamp: 500,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 20,
          to: 10,
        },
      ]),
    });

    expect(subjectKeyframes.get(source2)).toStrictEqual({
      height: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 0,
          to: 10,
        },
      ]),
    });
  });

  test("Parallel properties", () => {
    let source = new ColorSource({
      name: "Test Source",
    });

    processTimeline(
      {
        0: [
          keyframes(source, {
            width: 0,
            height: 0,
          }),
        ],
        500: [
          keyframes(source, {
            height: 20,
          }),
        ],
        1000: [
          keyframes(source, {
            width: 10,
            height: 10,
          }),
        ],
      },
      0
    );

    expect(subjectKeyframes.get(source)).toStrictEqual({
      width: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 0,
          to: 10,
        },
      ]),
      height: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 500,
          easing: Easing.Linear,
          from: 0,
          to: 20,
        },
        {
          beginTimestamp: 500,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 20,
          to: 10,
        },
      ]),
    });
  });

  test("Complex", () => {
    const source1 = new ColorSource({
      name: "Source 1",
    });

    const source2 = new ColorSource({
      name: "Source 2",
    });

    processTimeline(
      {
        0: [
          keyframes(source1, {
            width: 0,
            height: 0,
          }),
          keyframes(source2, {
            width: 0,
            height: 0,
          }),
        ],
        300: [
          keyframes(source2, {
            width: 50,
          }),
        ],
        500: [
          keyframes(source1, {
            width: 10,
            height: 20,
          }),
          keyframes(source2, {
            height: 35,
          }),
        ],
        800: [
          keyframes(source1, {
            width: 40,
          }),
          keyframes(source2, {
            width: 30,
          }),
        ],
        1000: [
          keyframes(source1, {
            width: 10,
            height: 10,
          }),
          keyframes(source2, {
            width: 20,
            height: 20,
          }),
        ],
      },
      0
    );

    expect(subjectKeyframes.get(source1)).toStrictEqual({
      width: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 500,
          easing: Easing.Linear,
          from: 0,
          to: 10,
        },
        {
          beginTimestamp: 500,
          endTimestamp: 800,
          easing: Easing.Linear,
          from: 10,
          to: 40,
        },
        {
          beginTimestamp: 800,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 40,
          to: 10,
        },
      ]),
      height: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 500,
          easing: Easing.Linear,
          from: 0,
          to: 20,
        },
        {
          beginTimestamp: 500,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 20,
          to: 10,
        },
      ]),
    });

    expect(subjectKeyframes.get(source2)).toStrictEqual({
      width: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 300,
          easing: Easing.Linear,
          from: 0,
          to: 50,
        },
        {
          beginTimestamp: 300,
          endTimestamp: 800,
          easing: Easing.Linear,
          from: 50,
          to: 30,
        },
        {
          beginTimestamp: 800,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 30,
          to: 20,
        },
      ]),
      height: new Queue<Keyframe>([
        {
          beginTimestamp: 0,
          endTimestamp: 0,
          easing: Easing.Linear,
          from: undefined,
          to: 0,
        },
        {
          beginTimestamp: 0,
          endTimestamp: 500,
          easing: Easing.Linear,
          from: 0,
          to: 35,
        },
        {
          beginTimestamp: 500,
          endTimestamp: 1000,
          easing: Easing.Linear,
          from: 35,
          to: 20,
        },
      ]),
    });
  });
});
