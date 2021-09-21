import { Source, SourceFilters } from "../Source";

interface Settings {
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
}

export class GDIPlusTextSource<F extends SourceFilters = SourceFilters> extends Source<Settings, F> {
  type = "text_gdiplus_v2";
}
