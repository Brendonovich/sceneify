import {
  DeepPartial,
  Input,
  SourceFilters,
  CustomInputArgs,
} from "@sceneify/core";

export type ColorSourceSettings = {
  color: number;
  width: number;
  height: number;
};

export class ColorSource<Filters extends SourceFilters = {}> extends Input<
  ColorSourceSettings,
  Filters
> {
  constructor(args: CustomInputArgs<ColorSourceSettings, Filters>) {
    super({ ...args, kind: "color_source_v3" });
  }

  override async setSettings(settings: DeepPartial<ColorSourceSettings>) {
    await super.setSettings(settings);

    this.itemInstances.forEach((item) =>
      item.updateSizeFromSource(this.settings.width, this.settings.height)
    );
  }
}
