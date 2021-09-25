import { obs } from "./obs";
import { Scene } from "./Scene";
import { Source } from "./Source";
import { DeepPartial } from "./types";
import { mergeDeep } from "./utils";

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

export type SceneItemProperties = {
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
};

export const DEFAULT_SCENE_ITEM_PROPERTIES: SceneItemProperties = {
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
export class SceneItem<
  TSource extends Source = Source,
  Properties extends SceneItemProperties = SceneItemProperties
> {
  constructor(
    public source: TSource,
    public scene: Scene,
    public id: number,
    public ref: string
  ) {
    source.itemInstances.add(this);

    mergeDeep(this.properties, DEFAULT_SCENE_ITEM_PROPERTIES);
  }

  properties = {} as Properties;

  async setProperties(properties: DeepPartial<Properties>) {
    await obs.setSceneItemProperties({
      scene: this.scene.name,
      id: this.id,
      ...properties,
    });

    mergeDeep(this.properties, properties);

    this.updateSizeFromSource();
  }

  /**
   * Some sources have custom settings for width and height. Thus, sourceWidth and
   * sourceHeight for their scene items can change. This method reassigns these values and
   * calculates properties.width and properties.height as a product of the source dimensions
   * and item scale.
   */
  updateSizeFromSource(sourceWidth?: number, sourceHeight?: number) {
    this.properties.sourceWidth = sourceWidth ?? this.properties.sourceWidth;
    this.properties.sourceHeight = sourceHeight ?? this.properties.sourceHeight;

    this.properties.width =
      this.properties.scale.x * this.properties.sourceWidth;
    this.properties.height =
      this.properties.scale.y * this.properties.sourceHeight;
  }

  async getProperties() {
    const newProperties = await obs.getSceneItemProperties({
      id: this.id,
      scene: this.scene.name,
    });

    mergeDeep(this.properties, newProperties);

    return this.properties;
  }

  delete() {
    this.source.itemInstances.delete(this);
    return obs.deleteSceneItem({ scene: this.scene.name, id: this.id });
  }
}
