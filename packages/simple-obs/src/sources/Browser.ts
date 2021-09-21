import { Source, SourceFilters } from "../Source";

interface Settings {
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
}

export class BrowserSource<F extends SourceFilters = SourceFilters> extends Source<
  Settings,
  F
> {
  type = "browser_source";
}
