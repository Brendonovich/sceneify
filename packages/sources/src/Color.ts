import {
  DeepPartial,
  Source,
  SourceFilters,
  CustomSourceArgs,
} from "@simple-obs/core";

export type ColorSourceSettings = {
  color: number;
  width: number;
  height: number;
};

export class ColorSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<ColorSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<ColorSourceSettings, Filters>) {
    super({ ...args, kind: "color_source_v3" });
  }

  override async setSettings(settings: DeepPartial<ColorSourceSettings>) {
    await super.setSettings(settings);

    this.itemInstances.forEach((item) =>
      item.updateSizeFromSource(this.settings.width, this.settings.height)
    );
  }
}
