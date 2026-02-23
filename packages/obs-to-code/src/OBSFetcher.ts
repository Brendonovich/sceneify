import OBSWebSocket from "obs-websocket-js";

/**
 * Configuration for connecting to OBS.
 */
export interface OBSConnectionConfig {
  url: string;
  password?: string;
}

/**
 * Represents an OBS input with its settings and filters.
 */
export interface OBSInput {
  name: string;
  kind: string;
  settings: Record<string, unknown>;
  filters: OBSFilter[];
}

/**
 * Represents an OBS filter.
 */
export interface OBSFilter {
  name: string;
  kind: string;
  settings: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Represents a scene item (input reference in a scene).
 */
export interface OBSSceneItem {
  sceneItemId: number;
  sourceName: string;
  sourceKind: string;
  sceneItemEnabled: boolean;
  sceneItemLocked: boolean;
  sceneItemIndex: number;
  transform: OBSSceneItemTransform;
}

/**
 * Transform properties for a scene item.
 */
export interface OBSSceneItemTransform {
  positionX?: number;
  positionY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  cropTop?: number;
  cropBottom?: number;
  cropLeft?: number;
  cropRight?: number;
}

/**
 * Represents an OBS scene with its items.
 */
export interface OBSScene {
  name: string;
  items: OBSSceneItem[];
}

/**
 * Complete OBS data structure.
 */
export interface OBSData {
  inputs: OBSInput[];
  scenes: OBSScene[];
}

/**
 * Fetches all relevant data from OBS via WebSocket.
 */
export class OBSFetcher {
  private ws: OBSWebSocket;

  constructor() {
    this.ws = new OBSWebSocket();
  }

  /**
   * Connects to OBS and fetches all data.
   */
  async fetchAllData(config: OBSConnectionConfig): Promise<OBSData> {
    try {
      await this.ws.connect(config.url, config.password);
      
      const [inputs, scenes] = await Promise.all([
        this.fetchInputs(),
        this.fetchScenes(),
      ]);

      return {
        inputs,
        scenes,
      };
    } finally {
      this.ws.disconnect();
    }
  }

  /**
   * Fetches all inputs with their settings and filters.
   */
  private async fetchInputs(): Promise<OBSInput[]> {
    const { inputs } = await this.ws.call("GetInputList");
    
    const inputsWithDetails = await Promise.all(
      (inputs as Array<{ inputName: string; inputKind: string }>).map(async (input) => {
        const [settingsResult, filtersResult] = await Promise.all([
          this.ws.call("GetInputSettings", { inputName: input.inputName as string }),
          this.ws.call("GetSourceFilterList", { sourceName: input.inputName as string }),
        ]);

        const filters = await Promise.all(
          (filtersResult.filters as any[]).map(async (filter) => {
            const filterSettings = await this.ws.call("GetSourceFilter", {
              sourceName: input.inputName as string,
              filterName: filter.filterName as string,
            });

            return {
              name: filter.filterName as string,
              kind: filter.filterKind as string,
              settings: filterSettings.filterSettings as Record<string, unknown>,
              enabled: filter.filterEnabled as boolean,
            };
          })
        );

        return {
          name: input.inputName as string,
          kind: input.inputKind as string,
          settings: settingsResult.inputSettings as Record<string, unknown>,
          filters,
        };
      })
    );

    return inputsWithDetails;
  }

  /**
   * Fetches all scenes with their items.
   */
  private async fetchScenes(): Promise<OBSScene[]> {
    const { scenes } = await this.ws.call("GetSceneList");
    
    const scenesWithItems = await Promise.all(
      (scenes as Array<{ sceneName: string }>).map(async (scene) => {
        const { sceneItems } = await this.ws.call("GetSceneItemList", {
          sceneName: scene.sceneName as string,
        });

        const items = await Promise.all(
          (sceneItems as any[]).map(async (item) => {
            const { sceneItemTransform } = await this.ws.call("GetSceneItemTransform", {
              sceneName: scene.sceneName as string,
              sceneItemId: item.sceneItemId as number,
            });

            const transform = sceneItemTransform as Record<string, number>;

            return {
              sceneItemId: item.sceneItemId as number,
              sourceName: item.sourceName as string,
              sourceKind: item.sourceKind as string,
              sceneItemEnabled: item.sceneItemEnabled as boolean,
              sceneItemLocked: item.sceneItemLocked as boolean,
              sceneItemIndex: item.sceneItemIndex as number,
              transform: {
                positionX: transform.positionX,
                positionY: transform.positionY,
                scaleX: transform.scaleX,
                scaleY: transform.scaleY,
                rotation: transform.rotation,
                cropTop: transform.cropTop,
                cropBottom: transform.cropBottom,
                cropLeft: transform.cropLeft,
                cropRight: transform.cropRight,
              },
            };
          })
        );

        // Sort items by index
        items.sort((a, b) => a.sceneItemIndex - b.sceneItemIndex);

        return {
          name: scene.sceneName as string,
          items,
        };
      })
    );

    return scenesWithItems;
  }
}
