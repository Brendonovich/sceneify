import {
  Input,
  SourceFilters,
  CustomInputArgs,
} from "@simple-obs/core";

export type GDIPlusTextSourceSettings = {
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
> extends Input<GDIPlusTextSourceSettings, Filters> {
  constructor(args: CustomInputArgs<GDIPlusTextSourceSettings, Filters>) {
    super({ ...args, kind: "text_gdiplus_v2" });
  }
}
