import "obs-websocket-js";

// export enum SceneItemAlignment {
//   CenterLeft = 1,
//   Center = 0,
//   CenterRight = 2,
//   TopLeft = 5,
//   TopCenter = 4,
//   TopRight = 6,
//   BottomLeft = 9,
//   BottomCenter = 8,
//   BottomRight = 10,
// }

// export enum SourceType {
//   OBS_SOURCE_TYPE_INPUT,
//   OBS_SOURCE_TYPE_FILTER,
//   OBS_SOURCE_TYPE_TRANSITION,
//   OBS_SOURCE_TYPE_SCENE,
// }

// declare module "obs-websocket-js/dist/json.modern" {
//   export * from "obs-websocket-js"
// }

declare module "obs-websocket-js" {
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

  export interface OBSRequestTypes {
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
  }

  export interface OBSResponseTypes {
    GetSceneItemList: {
      sceneItemId: number;
      sceneItemIndex: number;
      sourceName: string;
      sourceType: string;
      inputKind?: string;
      isGroup?: boolean;
    }[];

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
      };
      currentProgramSceneName: string;
      currentPreviewSceneName: string;
    };
  }
}
