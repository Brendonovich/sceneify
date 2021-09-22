import { Source, SourceFilters } from "../Source";

export class ColorSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    color: number;
    width: number;
    height: number;
  },
  F
> {
  type = "color_source_v3";
}
