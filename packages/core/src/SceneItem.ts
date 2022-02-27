import { DEFAULT_SCENE_ITEM_TRANSFORM } from "./constants";
import { Scene } from "./Scene";
import { Source } from "./Source";
import { mergeDeep } from "./utils";
import { SceneItemTransform as RawSceneItemTransform } from "./types";
import { Alignment, BoundsType } from ".";

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

/**
 * Represents an item of a source in OBS.
 * Creation of a SceneItem assumes that the item already exists in OBS.
 * It's the responsibility of the caller (probably a Source) to ensure that
 * the item has been created. SceneItems are for accessing already existing items.
 */
export class SceneItem<
  TSource extends Source = Source,
  TScene extends Scene = Scene
> {
  constructor(
    public source: TSource,
    public scene: TScene,
    public id: number,
    public ref: string
  ) {}

  transform: SceneItemTransform = { ...DEFAULT_SCENE_ITEM_TRANSFORM };
  enabled = true;
  locked = false;

  /**
   *
   * PROPERTIES
   *
   */

  /**
   * Fetches the item's transform, enabled, and locked properties and assigns them to the item.
   */
  async fetchProperties() {
    const args = {
      sceneName: this.scene.name,
      sceneItemId: this.id,
    };
    const [{ sceneItemTransform }, { sceneItemEnabled }, { sceneItemLocked }] =
      await Promise.all([
        this.source.obs.call("GetSceneItemTransform", args),
        this.source.obs.call("GetSceneItemEnabled", args),
        this.source.obs.call("GetSceneItemLocked", args),
      ]);

    this.transform = sceneItemTransform as SceneItemTransform;
    this.enabled = sceneItemEnabled;
    this.locked = sceneItemLocked;
  }

  async setTransform(transform: Partial<SceneItemTransform>) {
    await this.source.obs.call("SetSceneItemTransform", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      sceneItemTransform: transform as RawSceneItemTransform,
    });

    // Merge deep to ignore undefined
    // TODO: should probably be shallow merge
    mergeDeep(this.transform, transform);

    this.updateSizeFromSource();
  }

  async setEnabled(enabled: boolean) {
    await this.source.obs.call("SetSceneItemEnabled", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      sceneItemEnabled: enabled,
    });

    this.enabled = enabled;
  }

  async setLocked(locked: boolean) {
    await this.source.obs.call("SetSceneItemLocked", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      sceneItemLocked: locked,
    });

    this.locked = locked;
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

    this.transform.width = this.transform.scaleX * this.transform.sourceWidth;
    this.transform.height = this.transform.scaleY * this.transform.sourceHeight;
  }

  async remove() {
    await this.source.obs.call("RemoveSceneItem", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
    });

    this.source.itemInstances.delete(this);
    this.scene.items.splice(this.scene.items.indexOf(this), 1);
  }
}
