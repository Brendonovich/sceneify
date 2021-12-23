import { SceneItemTransform } from "obs-websocket-js";
import { OBS } from "./obs";
import { Scene } from "./Scene";
import { Source } from "./Source";
import { DeepPartial } from "./types";
import { mergeDeep } from "./utils";

/**
 * Represents an item of a source in OBS.
 * Creation of a SceneItem assumes that the item already exists in OBS.
 * It's the responsibility of the caller (probably a Source) to ensure that
 * the item has been created. SceneItems are for accessing already existing items.
 */
export class SceneItem<TSource extends Source = Source> {
  constructor(
    public source: TSource,
    public scene: Scene,
    public id: number,
    public ref: string
  ) {
    source.itemInstances.add(this);
  }

  transform = {} as SceneItemTransform;

  async setTransform(transform: DeepPartial<SceneItemTransform>) {
    await this.source.obs.socket.call("SetSceneItemTransform", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      transform,
    });

    mergeDeep(this.transform, transform);

    this.updateSizeFromSource();
  }

  /**
   * Some sources have custom settings for width and height. Thus, sourceWidth and
   * sourceHeight for their scene items can change. This method reassigns these values and
   * calculates properties.width and properties.height as a product of the source dimensions
   * and item scale.
   */
  updateSizeFromSource(sourceWidth?: number, sourceHeight?: number) {
    this.transform.sourceWidth = sourceWidth ?? this.transform.sourceWidth;
    this.transform.sourceHeight = sourceHeight ?? this.transform.sourceHeight;

    this.transform.width =
      this.transform.scaleX * this.transform.sourceWidth;
    this.transform.height =
      this.transform.scaleY * this.transform.sourceHeight;
  }

  async getTransform() {
    const { sceneItemTransform } = await this.source.obs.socket.call(
      "GetSceneItemTransform",
      {
        sceneItemId: this.id,
        sceneName: this.scene.name,
      }
    );

    mergeDeep(this.transform, sceneItemTransform);

    return this.transform;
  }

  // delete() {
  //   this.source.itemInstances.delete(this);
  //   return obs.deleteSceneItem({ scene: this.scene.name, id: this.id });
  // }
}
