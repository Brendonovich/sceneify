import { Filter, Input, OBS, SceneItem, Source } from "@sceneify/core";
import { AnimationSubject } from ".";

type SerializedTarget =
  | { type: SubjectType.SceneItem; sceneItemId: number; sceneName: string }
  | { type: SubjectType.Source; sourceName: string }
  | { type: SubjectType.Filter; sourceName: string; filterName: string };

interface SetKeyframesRequest {
  targets: ({
    animations: {
      property: string;
      keyframes: { timestamp: number; value: number }[];
    }[];
  } & SerializedTarget)[];
}

function getSubjectOBS(subject: AnimationSubject) {
  if (subject instanceof Source) return subject.obs;
  else return subject.source.obs;
}

enum SubjectType {
  SceneItem = 0,
  Source = 1,
  Filter = 2,
}

function serializeSubject(subject: AnimationSubject): SerializedTarget {
  if (subject instanceof Source)
    return {
      type: SubjectType.Source,
      sourceName: subject.name,
    };
  else if (subject instanceof SceneItem)
    return {
      type: SubjectType.SceneItem,
      sceneItemId: subject.id,
      sceneName: subject.scene.name,
    };
  else
    return {
      type: SubjectType.Filter,
      sourceName: subject.source.name,
      filterName: subject.name,
    };
}

export const keyframes = <S extends AnimationSubject>(
  source: S,
  animations: AnimationTarget<S>["animations"]
): AnimationTarget<S> => ({ source, animations });

type AnimatableProperties<S extends AnimationSubject> = S extends Input | Filter
  ? S["settings"]
  : S extends SceneItem
  ? S["transform"]
  : {};

type AnimationTarget<S extends AnimationSubject> = {
  source: S;
  animations: {
    [P in keyof AnimatableProperties<S>]?: {
      [timestamp: number]: number;
    };
  };
};

export async function pluginAnimate<
  Targets extends AnimationTarget<AnimationSubject>[]
>(targets: Targets) {
  const subjectsMap = new Map<OBS, AnimationTarget<AnimationSubject>[]>();

  for (const target of targets) {
    const obs = getSubjectOBS(target.source);
    const subjects = subjectsMap.get(obs) || [];
    subjects.push(target);
    subjectsMap.set(obs, subjects);
  }

  for (const [obs, targets] of subjectsMap) {
    const data: SetKeyframesRequest = {
      targets: targets.map((target) => ({
        ...serializeSubject(target.source),
        animations: Object.entries(target.animations).map(
          ([property, keyframes]) => ({
            property,
            keyframes: Object.entries(keyframes).map(([timeStr, value]) => ({
              timestamp: parseInt(timeStr),
              value,
            })),
          })
        ),
      })),
    };

    await obs.call("CallVendorRequest", {
      requestType: "SetAnimation",
      vendorName: "obs-animation",
      requestData: data as any,
    });
  }
}
