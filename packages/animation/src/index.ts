export * from "./easing";

import { Filter, Input, SceneItem, SceneItemTransform } from "@sceneify/core";
import { Queue } from "@datastructures-js/queue";

import { performance } from "./performance";
import { DEFAULT_EASING, Easing, easingFuncs } from "./easing";
import { DeepSearch } from "./types";
import { getDeep } from "./utils";

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type AnimatableProperties<
  T extends SceneItemTransform = SceneItemTransform
> = DeepSearch<
  Omit<T, "width" | "height" | "sourceWidth" | "sourceHeight">,
  KeyframeProperty
>;

export type AnimationSubject = SceneItem | Input | Filter;
export interface Keyframe<
  T extends number | string | boolean = number | string | boolean
> {
  beginTimestamp: number;
  endTimestamp: number;
  from?: T;
  to: T;
  easing: Easing;
  promise: Promise<any>;
  callback: () => void;
}

export function keyframe<T extends number | string | boolean>(
  value: T,
  easing: Easing
) {
  return new KeyframeInput(value, easing);
}

export type KeyframeProperty = number | string | boolean;

export type KeyframesFromSchema<P extends Record<string, KeyframeProperty>> = {
  [K in keyof P]?: Record<number, P[K] | KeyframeInput<P[K]>>;
};

export type SubjectKeyframeValues<Subject extends AnimationSubject> =
  Subject extends SceneItem
    ? KeyframesFromSchema<AnimatableProperties>
    : Subject extends Input<infer Settings>
    ? KeyframesFromSchema<Settings>
    : Subject extends Filter<infer Settings>
    ? KeyframesFromSchema<Settings | { visible?: boolean }>
    : never;

export interface Keyframes<Subject extends AnimationSubject> {
  subject: Subject;
  values: SubjectKeyframeValues<Subject>;
}

export const keyframes = <Subject extends AnimationSubject>(
  subject: Subject,
  values: SubjectKeyframeValues<Subject>
): Keyframes<Subject> => ({ subject, values });

interface SubjectKeyframes {
  [key: string]: SubjectKeyframes | Queue<Keyframe>;
}

class KeyframeInput<T extends string | number | boolean = any> {
  constructor(public value: T, public easing: Easing = DEFAULT_EASING) {}
}

export type Timeline<Subjects extends Record<string, AnimationSubject>> = {
  subjects: Subjects;
  keyframes: {
    [S in keyof Subjects]: SubjectKeyframeValues<Subjects[S]>;
  };
};

export type ProcessedTimeline<
  Subjects extends Record<string, AnimationSubject>
> = {
  [K in keyof Subjects]: SubjectKeyframes;
};

export const subjectKeyframes = new Map<AnimationSubject, SubjectKeyframes>();

export function processSubjectKeyframes<Subject extends AnimationSubject>(
  keyframesToProcess: SubjectKeyframeValues<Subject>,
  startTime: number,
  subject: Subject,
  parentPath: string[] = []
) {
  let ret: SubjectKeyframes = {};

  for (let property in keyframesToProcess) {
    const propertyValues = keyframesToProcess[property]!;
    const firstValue = Object.values(propertyValues)[0];

    const currentPath = [...parentPath, property];

    // propertyValues contains nested keyframes values
    if (
      typeof firstValue === "object" &&
      !(firstValue instanceof KeyframeInput)
    )
      ret[property] = processSubjectKeyframes(
        // Any since generics can be annoying
        propertyValues as any,
        startTime,
        subject,
        currentPath
      );
    // propertyValues contains keyframes
    else {
      const queue = (ret[property] = new Queue<Keyframe>());

      for (const [timeStr, value] of Object.entries(propertyValues)) {
        const time = parseInt(timeStr);

        const valueClass =
          value instanceof KeyframeInput
            ? value
            : new KeyframeInput(value as KeyframeProperty);

        let from;

        const back = queue.back();
        if (back) from = back.to;
        else if (subject instanceof SceneItem)
          from = getDeep(subject.transform, currentPath);
        else from = getDeep(subject.settings, currentPath);

        let callback = () => {};
        const promise = new Promise((res) => {
          callback = res as any;
        });

        queue.enqueue({
          from,
          to: valueClass.value,
          easing: valueClass.easing,
          beginTimestamp: back ? back.endTimestamp : startTime,
          endTimestamp: startTime + time,
          promise,
          callback,
        });
      }
    }
  }

  return ret;
}

export function processTimeline<
  Subjects extends Record<string, AnimationSubject>
>(timeline: Timeline<Subjects>, startTime = 0): ProcessedTimeline<Subjects> {
  const ret = {} as ProcessedTimeline<Subjects>;

  for (let subjectRef in timeline.keyframes) {
    let subject = timeline.subjects[subjectRef];

    ret[subjectRef] = processSubjectKeyframes(
      timeline.keyframes[subjectRef],
      startTime,
      subject
    );
  }

  return ret;
}

export function getSubjectKeyframesPromises(keyframes: SubjectKeyframes) {
  let ret = [] as Promise<any>[];

  for (let key in keyframes) {
    const value = keyframes[key];
    if (value instanceof Queue) ret.push(value.back().promise);
    else ret = ret.concat(getSubjectKeyframesPromises(value));
  }

  return ret;
}

export function unregisterSubjectKeyframes(keyframes: SubjectKeyframes) {
  for (let key in keyframes) {
    const value = keyframes[key];

    if (value instanceof Queue) value.back().callback?.();
    else unregisterSubjectKeyframes(value);
  }
}

export async function animate<
  Subjects extends Record<string, AnimationSubject>
>(timeline: Timeline<Subjects>) {
  const results = processTimeline(timeline, performance.now());

  for (let subjectRef in timeline.subjects) {
    const subject = timeline.subjects[subjectRef];

    if (subjectKeyframes.has(subject))
      unregisterSubjectKeyframes(subjectKeyframes.get(subject)!);

    subjectKeyframes.set(subject, results[subjectRef]);
  }

  play();

  await Promise.all(
    Object.values(results).reduce(
      (acc, results) => [...acc, ...getSubjectKeyframesPromises(results)],
      [] as Promise<any>[]
    )
  );
}

export let playing = false;
function play() {
  if (playing) return;

  animateTick();
  playing = true;
}

async function animateTick(): Promise<any> {
  const time = performance.now();

  for (let [subject, keyframes] of subjectKeyframes) {
    let interpolatedData = recursiveInterpolateKeyframes(keyframes, time);

    if (Object.keys(interpolatedData).length === 0) {
      subjectKeyframes.delete(subject);
      continue;
    }

    if (subject instanceof SceneItem) {
      subject.setTransform({
        ...interpolatedData,
        ...(interpolatedData.rotation
          ? { rotation: clipRotation(interpolatedData.rotation) }
          : undefined),
      });
    } else {
      subject.setSettings(interpolatedData);
      // if (interpolatedData.visible !== undefined && subject instanceof Filter)
      //   subject.setVisible(interpolatedData.visible);
    }
  }

  const drift = performance.now() - time;

  await wait(1000 / 60 - drift * 2);

  if (subjectKeyframes.size === 0) playing = false;

  if (playing) return animateTick();
}

export function recursiveInterpolateKeyframes(
  keyframes: SubjectKeyframes,
  time: number,
  currentPath: string[] = []
) {
  let ret: any = {};

  for (let property in keyframes) {
    let value = keyframes[property];

    if (value instanceof Queue) {
      let keyframe = value.front();

      if (keyframe.from === undefined) continue;

      let lerpedValue: string | number | boolean;
      if (typeof keyframe.from !== "number") lerpedValue = keyframe.from;
      else {
        let factor = Math.max(
          Math.min(
            (time - keyframe.beginTimestamp) /
              (keyframe.endTimestamp - keyframe.beginTimestamp),
            1
          ),
          0
        );
        lerpedValue = easingFuncs[keyframe.easing](
          keyframe.from,
          keyframe.to as number,
          factor
        );
      }

      ret[property] = lerpedValue;

      if (time > value.front().endTimestamp) {
        value.front().callback?.();
        value.dequeue();
      }
      if (value.isEmpty()) delete keyframes[property];
    } else {
      if (Object.keys(value).length === 0) delete keyframes[property];
      else
        ret[property] = recursiveInterpolateKeyframes(value, time, [
          ...currentPath,
          property,
        ]);
    }
  }

  return ret;
}
function clipRotation(rotation: number): number {
  return rotation % 360;
}
