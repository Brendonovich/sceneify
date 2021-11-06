import { Source, SourceFilters } from "../Source";

export class GDIPlusTextSource<
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
    color: number;
    read_from_file: boolean;
    file: string;
  },
  F
> {
  type = "text_gdiplus_v2";
}
