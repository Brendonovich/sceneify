import { Source, SourceFilters } from "../Source";
import { DeepPartial } from "../types";

type Settings = {
  color: number;
  width: number;
  height: number;
};

export class ColorSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "color_source_v3";

  async setSettings(settings: DeepPartial<Settings>) {
    await super.setSettings(settings);

    this.itemInstances.forEach((item) =>
      item.updateSourceSize(this.settings.width, this.settings.height)
    );
  }
}
