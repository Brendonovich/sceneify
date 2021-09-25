import { Source, SourceFilters } from "../Source";
import { DeepPartial } from "../types";

type Settings = {
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
};

export class BrowserSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "browser_source";

  async setSettings(settings: DeepPartial<Settings>) {
    await super.setSettings(settings);

    this.itemInstances.forEach((item) =>
      item.updateSourceSize(this.settings.width, this.settings.height)
    );
  }
}
