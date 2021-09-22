import { Source, SourceFilters } from "../Source";

export class FreetypeTextSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    text: string;
    font: {
      face: string;
      flags: number;
      size: number;
      style: string;
    };
    antialiasing: boolean;
    color1: number;
    color2: number;
  },
  F
> {
  type = "text_ft2_source_v2";
}
