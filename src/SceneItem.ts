import { obs } from "./obs";
import { Scene } from "./Scene";
import { BaseSettings, Source } from "./Source";
import { DeepPartial } from "./types";

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

export interface SceneItemProperties {
  position: {
    x: number;
    y: number;
    alignment: Alignment;
  };
  scale: {
    x: number;
    y: number;
    filter: string;
  };
  crop: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  bounds: {
    type: string;
    alignment: Alignment;
    x: number;
    y: number;
  };
  rotation: number;
  visible: boolean;
  locked: boolean;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
}

const DEFAULT_PROPERTIES: SceneItemProperties = {
  position: {
    x: 0,
    y: 0,
    alignment: 0,
  },
  scale: {
    x: 1,
    y: 1,
    filter: "",
  },
  crop: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  bounds: {
    type: "",
    alignment: 0,
    x: 0,
    y: 0,
  },
  rotation: 0,
  visible: true,
  locked: false,
  sourceWidth: 0,
  sourceHeight: 0,
  width: 0,
  height: 0,
};

/**
 * Represents an item of a source in OBS.
 * Creation of a SceneItem assumes that the item already exists in OBS.
 * It's the responsibility of the caller (probably a Source) to ensure that
 * the item has been created. SceneItems are for accessing already existing items.
 */
export class SceneItem<TSource extends Source = Source> {
  constructor(public source: TSource, public scene: Scene, public id: number) {
    // This could be done by the source but may as well do it here since
    // if a SceneItem is being created there was success creating the source anyway
    obs.sources.set(source.name, source);
  }

  properties = DEFAULT_PROPERTIES;

  async setProperties({
    position,
    scale,
    crop,
    bounds,
    ...properties
  }: DeepPartial<SceneItemProperties>) {
    this.properties = {
      ...this.properties,
      position: {
        ...this.properties.position,
        ...position,
      },
      scale: {
        ...this.properties.scale,
        ...scale,
      },
      crop: {
        ...this.properties.crop,
        ...crop,
      },
      bounds: {
        ...this.properties.bounds,
        ...bounds,
      },
      ...properties,
    };

    this.properties.width =
      this.properties.scale.x * this.properties.sourceWidth;
    this.properties.height =
      this.properties.scale.y * this.properties.sourceHeight;

    await obs.setSceneItemProperties({
      scene: this.scene.name,
      id: this.id,
      position,
      scale,
      crop,
      bounds,
      ...properties,
    });
  }

  delete() {
    return obs.deleteSceneItem({ scene: this.scene.name, id: this.id });
  }
}
