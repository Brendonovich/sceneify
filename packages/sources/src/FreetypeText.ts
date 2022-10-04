import { Input, SourceFilters, CustomInputArgs, Font } from "@sceneify/core";

export type FreetypeTextSourceSettings = {
  font: Font;
  text: string;
  from_file: boolean;
  antialiasing: boolean;
  log_mode: boolean;
  log_lines: number;
  text_file: string;
  color1: number;
  color2: number;
  outline: boolean;
  drop_shadow: boolean;
  custom_width: number;
  word_wrap: boolean;
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
