import { Source, SourceFilters } from "../Source";

export class BrowserSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    url: string;
    width: number;
    height: number;
    reroute_audio: boolean;
  },
  F
> {
  type = "browser_source";
}
