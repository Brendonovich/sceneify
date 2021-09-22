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

beforeEach(() => {
  subjectKeyframes.clear();
});

test("Processes simple keyframes", () => {
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

test("Processes nested keyframes", () => {
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

test("Processes keyframes for parallel subjects", () => {
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

test("Processes keyframes for parallel properties", () => {
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
