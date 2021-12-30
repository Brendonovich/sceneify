import { CustomSourceArgs, Source, SourceArgs, SourceFilters } from "../Source";

type Settings = {
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
};

export class FreetypeTextSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: CustomSourceArgs<Settings, Filters>) {
    super({
      ...args,
      type: "text_ft2_source_v2",
    });
  }
}
