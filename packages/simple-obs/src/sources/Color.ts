import { Source, SourceFilters } from "../Source";

interface Settings {
  color: number;
  width: number;
  height: number;
}

export class ColorSource<F extends SourceFilters = SourceFilters> extends Source<Settings, F> {
  type = "color_source_v3";
}
