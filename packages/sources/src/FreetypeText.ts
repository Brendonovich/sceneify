import { Source, SourceFilters, CustomSourceArgs } from "@simple-obs/core";

export type FreetypeTextSourceSettings = {
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
> extends Source<FreetypeTextSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<FreetypeTextSourceSettings, Filters>) {
    super({
      ...args,
      kind: "text_ft2_source_v2",
    });
  }
}
