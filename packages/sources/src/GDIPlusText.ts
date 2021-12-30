import {
  Source,
  SourceFilters,
  CustomSourceArgs,
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
> extends Source<GDIPlusTextSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<GDIPlusTextSourceSettings, Filters>) {
    super({ ...args, type: "text_gdiplus_v2" });
  }
}
