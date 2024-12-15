export interface OBSSceneItemTransform {
  sourceWidth: number;
  sourceHeight: number;

  positionX: number;
  positionY: number;

  rotation: number;

  scaleX: number;
  scaleY: number;

  width: number;
  height: number;

  alignment: OBSAlignment;

  boundsType: OBSBoundsType;
  boundsAlignment: OBSAlignment;
  boundsWidth: number;
  boundsHeight: number;

  cropLeft: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
}

export type OBSAlignment = 0 | 1 | 2 | 4 | 5 | 6 | 8 | 9 | 10;
export type OBSBoundsType =
  | "OBS_BOUNDS_NONE"
  | "OBS_BOUNDS_STRETCH"
  | "OBS_BOUNDS_SCALE_INNER"
  | "OBS_BOUNDS_SCALE_OUTER"
  | "OBS_BOUNDS_SCALE_TO_WIDTH"
  | "OBS_BOUNDS_SCALE_TO_HEIGHT"
  | "OBS_BOUNDS_MAX_ONLY";
export type OBSMonitoringType =
  | "OBS_MONITORING_TYPE_NONE"
  | "OBS_MONITORING_TYPE_MONITOR_ONLY"
  | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT";

export interface OBSFont {
  face: string;
  flags: number;
  size: number;
  style: string;
}

export type OBSVideoRange = 0 | 1 | 2;

export type OBSVolumeInput = { db: number } | { mul: number };
