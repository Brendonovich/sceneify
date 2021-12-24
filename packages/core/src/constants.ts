import { SceneItemTransform } from "./types";

export enum Alignment {
  CenterLeft = 1,
  Center = 0,
  CenterRight = 2,
  TopLeft = 5,
  TopCenter = 4,
  TopRight = 6,
  BottomLeft = 9,
  BottomCenter = 8,
  BottomRight = 10,
}

export enum SourceType {
  OBS_SOURCE_TYPE_INPUT,
  OBS_SOURCE_TYPE_FILTER,
  OBS_SOURCE_TYPE_TRANSITION,
  OBS_SOURCE_TYPE_SCENE,
}
export enum BoundsType {
  None = "OBS_BOUNDS_NONE",
  Stretch = "OBS_BOUNDS_STRETCH",
  ScaleInner = "OBS_BOUNDS_SCALE_INNER",
  ScaleOuter = "OBS_BOUNDS_SCALE_OUTER",
  ScaleToWidth = "OBS_BOUNDS_SCALE_TO_WIDTH",
  ScaleToHeight = "OBS_BOUNDS_SCALE_TO_HEIGHT",
  MaxOnly = "OBS_BOUNDS_MAX_ONLY",
}

export enum MonitoringType {
  None = "OBS_MONITORING_TYPE_NONE",
  MonitorOnly = "OBS_MONITORING_TYPE_MONITOR_ONLY",
  MonitorAndOutput = "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT",
}

export const DEFAULT_SCENE_ITEM_TRANSFORM: SceneItemTransform = {
  positionX: 0,
  positionY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  alignment: Alignment.Center,
  boundsAlignment: Alignment.Center,
  sourceWidth: 0,
  sourceHeight: 0,
  width: 0,
  height: 0,
  boundsWidth: 0,
  boundsHeight: 0,
  boundsType: BoundsType.None,
};
