export * from "./easing";

import { Filter, SceneItem, SceneItemProperties, Source } from "simple-obs";
import { Queue } from "@datastructures-js/queue";
import { performance } from "./performance";

import { DEFAULT_EASING, Easing, easingFuncs } from "./easing";
import { DeepSearch } from "./types";

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type AnimatableProperties<T extends SceneItemProperties = SceneItemProperties> =
  DeepSearch<
    Omit<T, "width" | "height" | "sourceWidth" | "sourceHeight">,
    number | boolean | string
  >;

export interface Keyframe<
  T extends number | string | boolean = number | string | boolean
> {
  beginTimestamp: number;
  endTimestamp: number;
  from?: T;
  to: T;
  easing: Easing;
}

export function keyframe<T extends number | string | boolean>(
  value: T,
  easing: Easing
) {
  return new KeyframeInput(value, easing);
}

export type KeyframeInputFromPrivitives<
  P extends Record<
    string,
    number | string | boolean | Record<string, number | string | boolean>
  >
> = {
  [K in keyof P]?: P[K] extends number | string | boolean
    ? P[K] | KeyframeInput<P[K]>
    : P[K] extends Record<string, number | string | boolean>
    ? KeyframeInputFromPrivitives<P[K]>
    : never;
};

export type KeyframeValues<Subject extends SceneItem | Source | Filter> =
  Subject extends SceneItem
    ? KeyframeInputFromPrivitives<SceneItemProperties>
    : Subject extends Source
    ? KeyframeInputFromPrivitives<Subject["_settingsType"]>
    : Subject extends Filter
    ? KeyframeInputFromPrivitives<Subject["_settingsType"]>
    : never;

export type AnimationSubject = SceneItem | Source | Filter;

export interface Keyframes<Subject extends AnimationSubject> {
  subject: Subject;
  values: KeyframeValues<Subject>;
}

export const keyframes = <Subject extends AnimationSubject>(
  subject: Subject,
  values: KeyframeValues<Subject>
): Keyframes<Subject> => ({ subject, values });

interface SubjectKeyframes {
  [key: string]: SubjectKeyframes | Queue<Keyframe>;
}

export const subjectKeyframes = new Map<AnimationSubject, SubjectKeyframes>();

class KeyframeInput<T extends string | number | boolean = any> {
  constructor(public value: T, public easing: Easing = DEFAULT_EASING) {}
}

type KeyframeInputValue = string | number | boolean | KeyframeInput;

function getDeep(obj: any, path: string[]) {
  for (let i = 0, len = path.length; i < len; i++) {
    obj = obj[path[i]];
  }
  return obj;
}

type KeyframesInput =
  | KeyframeInputValue
  | {
      [key: string]: KeyframeInputValue | KeyframesInput;
    };

/**
 * @internal
 */
export function recurseKeyframes(
  subjectData: SubjectKeyframes,
  keyframesToProcess: Record<string, KeyframesInput>,
  beginTimestamp: number,
  endTimestamp: number,
  subject: AnimationSubject,
  parentPath: string[] = []
) {
  for (let pathName in keyframesToProcess) {
    let value = keyframesToProcess[pathName];
    let currentPath = [...parentPath, pathName];

    if (typeof value === "object" && !(value instanceof KeyframeInput)) {
      recurseKeyframes(
        ((subjectData as any)[pathName] ||= {}),
        value,
        beginTimestamp,
        endTimestamp,
        subject,
        currentPath
      );
    } else {
      let valueClass =
        value instanceof KeyframeInput ? value : new KeyframeInput(value);

      let queue: Queue<Keyframe> = ((subjectData[
        pathName
      ] as Queue<Keyframe>) ||= new Queue());

      let from;

      let back = queue.back();
      if (back) from = back.to;
      else {
        if (subject instanceof SceneItem)
          from = getDeep(subject.properties, currentPath);
        else from = getDeep(subject.settings, currentPath);
      }

      let kf: Keyframe = {
        from,
        to: valueClass.value,
        easing: valueClass.easing,
        beginTimestamp,
        endTimestamp,
      };

      queue.enqueue(kf);
    }
  }
}

export function playTimeline(
  timeline: Record<number, Keyframes<AnimationSubject>[]>
) {
  let startTime = performance.now();
  let beginTime = startTime;

  Object.values(timeline).forEach((keyframes) =>
    keyframes.forEach(({ subject }) => subjectKeyframes.delete(subject))
  );

  for (let timeStr in timeline) {
    let timestamp = parseInt(timeStr);

    let endTime = startTime + timestamp;

    for (let keyframes of timeline[timestamp]) {
      if (!subjectKeyframes.has(keyframes.subject))
        subjectKeyframes.set(keyframes.subject, {});

      const currentSubjectData = subjectKeyframes.get(keyframes.subject)!;

      recurseKeyframes(
        currentSubjectData,
        keyframes.values as any,
        beginTime,
        endTime,
        keyframes.subject
      );
    }

    beginTime += timestamp;
  }

  play();
}

let playing = false;
function play() {
  if (playing) return;

  animateTick();
  playing = true;
}

async function animateTick(): Promise<any> {
  const time = performance.now();

  for (let [subject, keyframes] of subjectKeyframes) {
    let interpolatedData = recursiveInterpolateKeyframes(keyframes, time)
    
    if (Object.keys(interpolatedData).length === 0) {
      subjectKeyframes.delete(subject);
      continue;
    }

    if (subject instanceof SceneItem) subject.setProperties(interpolatedData);
    else subject.setSettings(interpolatedData);
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

      if (time > value.front().endTimestamp) value.dequeue();
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
