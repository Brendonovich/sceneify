export interface SceneItemTransform {
  sourceWidth: number;
  sourceHeight: number;

  positionX: number;
  positionY: number;

  rotation: number;

  scaleX: number;
  scaleY: number;

  width: number;
  height: number;

  alignment: Alignment;

  boundsType: BoundsType;
  boundsAlignment: Alignment;
  boundsWidth: number;
  boundsHeight: number;

  cropLeft: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
}

export type SceneItemTransformInput = Partial<
  Omit<
    SceneItemTransform,
    | "width"
    | "height"
    | "sourceWidth"
    | "sourceHeight"
    | "boundsWidth"
    | "boundsHeight"
  >
>;

export function sceneItemTransformToOBS(
  transform: Partial<SceneItemTransform>
): Partial<OBSSceneItemTransform> {
  return {
    ...transform,
    alignment: transform.alignment
      ? alignmentToOBS(transform.alignment)
      : undefined,
    boundsAlignment: transform.boundsAlignment
      ? alignmentToOBS(transform.boundsAlignment)
      : undefined,
    boundsType: transform.boundsType
      ? boundsTypeToOBS(transform.boundsType)
      : undefined,
  };
}

type Alignment =
  | "centerLeft"
  | "center"
  | "centerRight"
  | "topLeft"
  | "top"
  | "topRight"
  | "bottomLeft"
  | "bottom"
  | "bottomRight";

import {
  OBSAlignment,
  OBSBoundsType,
  OBSSceneItemTransform,
} from "./obs-types.js";

const Alignment: Record<Alignment, OBSAlignment> = {
  centerLeft: 1,
  center: 0,
  centerRight: 2,
  topLeft: 5,
  top: 4,
  topRight: 6,
  bottomLeft: 9,
  bottom: 8,
  bottomRight: 10,
};

export function alignmentToOBS(alignment: Alignment): OBSAlignment {
  return Alignment[alignment];
}

type BoundsType =
  | "none"
  | "stretch"
  | "scaleInner"
  | "scaleOuter"
  | "scaleToWidth"
  | "scaleToHeight"
  | "maxOnly";

const BoundsType: Record<BoundsType, OBSBoundsType> = {
  none: "OBS_BOUNDS_NONE",
  stretch: "OBS_BOUNDS_STRETCH",
  scaleInner: "OBS_BOUNDS_SCALE_INNER",
  scaleOuter: "OBS_BOUNDS_SCALE_OUTER",
  scaleToWidth: "OBS_BOUNDS_SCALE_TO_WIDTH",
  scaleToHeight: "OBS_BOUNDS_SCALE_TO_HEIGHT",
  maxOnly: "OBS_BOUNDS_MAX_ONLY",
};

export function boundsTypeToOBS(boundsType: BoundsType): OBSBoundsType {
  return BoundsType[boundsType];
}
