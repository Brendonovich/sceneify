import { SceneItemTransform } from "obs-websocket-js";
import { SceneItemProperties } from "../SceneItem";
import { FieldPartial } from "../types";

export interface RequestArgsMap {
  AddFilterToSource: {
    sourceName: string;
    filterName: string;
    filterType: string;
    filterSettings: object;
  };

  AddSceneItem: {
    sceneName: string;
    sourceName: string;
    setVisible?: boolean;
  };

  CreateSource: {
    sourceName: string;
    sourceKind: string;
    sceneName?: string;
    sourceSettings?: object;
    setVisible?: boolean;
  };

  CreateScene: {
    sceneName: string;
  };

  DeleteSceneItem: {
    scene?: string;
    item:
      | string
      | {
          id: number;
        };
  };

  ExecuteBatch: {
    requests: {}[];
  };

  GetSceneItemList: {
    sceneName: string;
  };

  GetSceneItemProperties: {
    "scene-name": string;
    item:
      | string
      | {
          id: number;
        };
  };

  GetSceneList: {};

  GetSourceDefaultSettings: {
    sourceKind: string;
  };

  GetSourceFilters: {
    sourceName: string;
  };

  GetSourceFilterInfo: {
    sourceName: string;
    filterName: string;
  };

  GetSourceSettings: {
    sourceName: string;
    sourceType?: string;
  };

  GetSourcesList: {};

  GetSourceTypesList: {};

  GetVideoInfo: {};

  MoveSourceFilter: {
    sourceName: string;
    filterName: string;
    movementType: string;
  };

  RemoveFilterFromSource: {
    sourceName: string;
    filterName: string;
  };

  RemoveScene: {
    sceneName: string;
  };

  ReorderSceneItems: {
    scene: string;
    items: (
      | {
          id: number;
        }
      | {
          name: string;
        }
    )[];
  };

  ReorderSourceFilter: {
    sourceName: string;
    filterName: string;
    newIndex: number;
  };

  SetAudioMonitorType: {
    sourceName: string;
    monitorType: string;
  };

  SetCurrentScene: {
    "scene-name": string;
  };

  SetSceneItemProperties: {
    item:
      | string
      | {
          id: number;
        };
    "scene-name": string;
  } & FieldPartial<SceneItemProperties>;

  SetSourceFilterSettings: {
    sourceName: string;
    filterName: string;
    filterSettings: {};
  };

  SetSourceFilterVisibility: {
    sourceName: string;
    filterName: string;
    filterEnabled: boolean;
  };

  SetSourceSettings: {
    sourceName: string;
    sourceType?: string;
    sourceSettings: object;
  };

  SetVolume: {
    source: string;
    volume: number;
    useDecibel?: boolean;
  };

  ToggleMute: {
    source: string;
  };
}

export interface RequestResponseMap {
  AddFilterToSource: {};

  AddSceneItem: {
    itemId: number;
  };

  CreateSource: {
    itemId: number;
  };

  CreateScene: {};

  DeleteSceneItem: {};

  ExecuteBatch: {
    results: {}[];
  };

  GetSceneItemList: {
    sceneName: string;
    sceneItems: {
      itemId: number;
      sourceKind: string;
      sourceName: string;
      sourceType: "input" | "group" | "scene";
    }[];
  };

  GetSceneItemProperties: SceneItemProperties & {
    itemId: number;
    name: string;
  };

  GetSceneList: {
    "current-scene": string;
    scenes: {
      name: string;
      sources: {
        type: string;
        name: string;
        id: number;
      }[];
    }[];
  };

  GetSourceDefaultSettings: {
    sourceKind: string;
    defaultSettings: {};
  };

  GetSourceFilters: {
    filters: {
      enabled: boolean;
      type: string;
      name: string;
      settings: {};
    }[];
  };

  GetSourceFilterInfo: {
    enabled: boolean;
    type: string;
    name: string;
    settings: {};
  };

  GetSourceSettings: {
    sourceName: string;
    sourceType: string;
    sourceSettings: Record<string, any>;
  };

  GetSourceTypesList: {
    types: {
      typeId: string;
      displayName: string;
      defaultSettings: object;
      caps: {
        isAsync: boolean;
        hasVideo: boolean;
        hasAudio: boolean;
        canInteract: boolean;
        isComposite: boolean;
        doNotDuplicate: boolean;
        doNotSelfMonitor: boolean;
      };
    }[];
  };

  GetSourcesList: {
    sources: {
      name: string;
      typeId: string;
      type: string;
    }[];
  };

  GetVideoInfo: {
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
    scaleType: string;
    fps: number;
    videoFormat: string;
    colorSpace: string;
    colorRange: string;
  };

  MoveSourceFilter: {};

  RemoveFilterFromSource: {};

  RemoveScene: {};

  ReorderSceneItems: {};

  ReorderSourceFilter: {};

  SetAudioMonitorType: {};

  SetCurrentScene: {};

  SetSceneItemProperties: {};

  SetSourceFilterSettings: {};

  SetSourceFilterVisibility: {};

  SetSourceSettings: {
    sourceName: string;
    sourceType: string;
    sourceSettings: object;
  };

  SetVolume: {};
  
  ToggleMute: { };
}

export interface EventsDataMap {
  SceneItemRemoved: {
    "scene-name": string;
    "item-name": string;
    "item-id": number;
  };

  SceneItemTransformChanged: {
    "scene-name": string;
    "item-name": string;
    "item-id": number;
    transform: SceneItemTransform;
  };

  [key: `SceneItemTransformChanged:${string}:${number}`]: SceneItemTransform;

  MediaStarted: {
    sourceName: string;
    sourceKind: string;
  };

  MediaEnded: {
    sourceName: string;
    sourceKind: string;
  };
}
