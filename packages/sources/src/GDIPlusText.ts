import { Font, Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type GDIPlusTextSourceSettings = {
  text: string;
  font: Font;
  antialiasing: boolean;
  color: number;
  read_from_file: boolean;
  file: string;
};

export class GDIPlusTextSource<
  Filters extends SourceFilters = {}
> extends Input<GDIPlusTextSourceSettings, Filters> {
  constructor(args: CustomInputArgs<GDIPlusTextSourceSettings, Filters>) {
    super({ ...args, kind: "text_gdiplus_v2" });
  }
}
