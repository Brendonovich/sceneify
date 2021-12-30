import { CustomSourceArgs, Source, SourceFilters } from "../Source";

type Settings = {
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
};

export class GDIPlusTextSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: CustomSourceArgs<Settings, Filters>) {
    super({ ...args, type: "text_gdiplus_v2" });
  }
}
