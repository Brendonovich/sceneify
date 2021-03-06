import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

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
  Filters extends SourceFilters = {}
> extends Input<FreetypeTextSourceSettings, Filters> {
  constructor(args: CustomInputArgs<FreetypeTextSourceSettings, Filters>) {
    super({
      ...args,
      kind: "text_ft2_source_v2",
    });
  }
}
