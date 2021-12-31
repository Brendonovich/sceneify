import {
  DeepPartial,
  Source,
  SourceFilters,
  SceneItem,
  Scene,
  CustomSourceArgs,
} from "@simple-obs/core";

export type BrowserSourceSettings = {
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
};

export class BrowserSourceItem<
  Source extends BrowserSource
> extends SceneItem<Source> {
  constructor(source: Source, scene: Scene, id: number, ref: string) {
    super(source, scene, id, ref);

    this.updateSizeFromSource(source.settings.width, source.settings.height);
  }
}

/**
 * **Warning**: BrowserSource items will not have correct properties when they are
 * initialized, as browser sources are always created with a width and height of 0.
 * If width and height are not provided in the source's intial settings, it's intial
 * item will have a width and height of 0 until item.getProperties is called,
 * or the source's width and height are updated.
 */
export class BrowserSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<BrowserSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<BrowserSourceSettings, Filters>) {
    super({ ...args, kind: "browser_source" });
  }

  override createItemInstance(
    scene: Scene,
    id: number,
    ref: string
  ): BrowserSourceItem<this> {
    return new BrowserSourceItem(this, scene, id, ref);
  }

  override async setSettings(settings: DeepPartial<BrowserSourceSettings>) {
    await super.setSettings(settings);

    this.itemInstances.forEach((item) =>
      item.updateSizeFromSource(this.settings.width, this.settings.height)
    );
  }
}
