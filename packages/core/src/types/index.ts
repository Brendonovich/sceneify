import { Source } from "../Source";
import {
  OBSRequestTypes as BaseRequestTypes,
  OBSResponseTypes as BaseResponseTypes,
} from "obs-websocket-js";

/**
 * Makes every field and nested field optional in the provided object.
 */
export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type FilterType<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
  }[keyof Base]
>;

export type SourceItemType<S extends Source> = ReturnType<
  S["createSceneItemObject"]
>;

export type Settings = Record<string, any>;

export interface Filter {
  filterName: string;
  filterEnabled: boolean;
  filterIndex: number;
  filterKind: string;
  filterSettings: Settings;
}

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

  alignment: number;

  boundsType:
    | "OBS_BOUNDS_NONE"
    | "OBS_BOUNDS_STRETCH"
    | "OBS_BOUNDS_SCALE_INNER"
    | "OBS_BOUNDS_SCALE_OUTER"
    | "OBS_BOUNDS_SCALE_TO_WIDTH"
    | "OBS_BOUNDS_SCALE_TO_HEIGHT"
    | "OBS_BOUNDS_MAX_ONLY";
  boundsAlignment: number;
  boundsWidth: number;
  boundsHeight: number;

  cropLeft: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
}

export interface OBSRequestTypesOverrides {
  GetSceneItemList: {
    sceneName: string;
  };

  GetSceneItemTransform: {
    sceneName: string;
    sceneItemId: number;
  };

  SetSceneItemTransform: {
    sceneName: string;
    sceneItemId: number;
    transform: Partial<SceneItemTransform>;
  };

  CreateSceneItem: {
    sceneName: string;
    sourceName: string;
    sceneItemEnabled?: boolean;
  };

  RemoveSceneItem: {
    sceneName: string;
    sceneItemId: number;
  };

  GetSceneList: never;

  GetSceneItemEnabled: {
    sceneName: string;
    sceneItemId: number;
  };

  SetSceneItemEnabled: {
    sceneName: string;
    sceneItemId: number;
    sceneItemEnabled: boolean;
  };

  GetSceneItemLocked: {
    sceneName: string;
    sceneItemId: number;
  };

  SetSceneItemLocked: {
    sceneName: string;
    sceneItemId: number;
    sceneItemLocked: boolean;
  };

  StartStream: never;

  StopStream: never;

  ToggleStream: never;

  GetSourceFilterList: {
    sourceName: string;
  };

  CreateSourceFilter: {
    sourceName: string;
    filterName: string;
    filterIndex?: number;
    filterKind: string;
    filterSettings?: Settings;
  };

  RemoveSourceFilter: {
    sourceName: string;
    filterName: string;
  };

  GetSourceFilterDefaultSettings: {
    filterKind: string;
  };

  GetSourceFilter: {
    sourceName: string;
    filterName: string;
  };

  SetSourceFilterIndex: {
    sourceName: string;
    filterName: string;
    filterIndex: number;
  };

  SetSourceFilterSettings: {
    sourceName: string;
    filterName: string;
    filterSettings: Settings;
  };

  SetSourceFilterEnabled: {
    sourceName: string;
    filterName: string;
    filterEnabled: boolean;
  };

  SetSourcePrivateSettings: {
    sourceName: string;
    sourceSettings: Settings;
  };

  GetSourcePrivateSettings: {
    sourceName: string;
  };

  GetInputSettings: {
    inputName: string;
  };

  SetInputSettings: {
    inputName: string;
    inputSettings: Settings;
  };
}

export interface OBSResponseTypesOverrides {
  GetSceneItemList: {
    sceneItems: {
      sceneItemId: number;
      sceneItemIndex: number;
      sourceName: string;
      sourceType: string;
      inputKind?: string;
      isGroup?: boolean;
    }[];
  };

  GetSceneItemTransform: { sceneItemTransform: SceneItemTransform };

  SetSceneItemTransform: undefined;

  CreateSceneItem: {
    sceneItemId: number;
  };

  RemoveSceneItem: undefined;

  GetSceneList: {
    scenes: {
      sceneName: string;
      sceneIndex: number;
    }[];
    currentProgramSceneName: string;
    currentPreviewSceneName: string;
  };

  GetInputList: {
    inputs: {
      inputName: string;
      inputKind: string;
      unversionedInputKind: string;
    }[];
  };

  GetInputSettings: {
    inputSettings: Settings;
    inputName: string;
    inputKind: string;
  };

  SetInputSettings: undefined;

  GetSceneItemEnabled: {
    sceneItemEnabled: boolean;
  };

  SetSceneItemEnabled: undefined;

  GetSceneItemLocked: {
    sceneItemLocked: boolean;
  };

  SetSceneItemLocked: undefined;

  StartStream: undefined;

  StopStream: undefined;

  ToggleStream: {
    outputActive: boolean;
  };

  GetInputAudioMonitorType: {
    monitorType:
      | "OBS_MONITORING_TYPE_NONE"
      | "OBS_MONITORING_TYPE_MONITOR_ONLY"
      | "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT";
  };

  GetSourceFilterList: {
    filters: Filter[];
  };

  CreateSourceFilter: undefined;

  RemoveSourceFilter: undefined;

  GetSourceFilterDefaultSettings: { filterSettings: Settings };

  GetSourceFilter: Filter;

  SetSourceFilterIndex: undefined;

  SetSourceFilterSettings: undefined;

  SetSourceFilterEnabled: undefined;

  SetSourcePrivateSettings: undefined;

  GetSourcePrivateSettings: {
    sourceSettings: Settings;
  };
}

export type PatchedOBSRequestTypes =
  | Omit<BaseRequestTypes, keyof OBSRequestTypesOverrides> &
      OBSRequestTypesOverrides;

export type PatchedOBSResponseTypes =
  | Omit<BaseResponseTypes, keyof OBSResponseTypesOverrides> &
      OBSResponseTypesOverrides;
