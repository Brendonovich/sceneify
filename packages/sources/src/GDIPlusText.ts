import { Font, Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export const GDITransform = {
  None: 0,
  Uppercase: 1,
  Lowercase: 2,
  Startcase: 3,
};

export const GDIAlign = {
  Left: "left",
  Center: "center",
  Right: "right",
};

export const GDIVAlign = {
  Top: "top",
  Center: "center",
  Bottom: "bottom",
};

export type GDIPlusTextSourceSettings = {
  font: Font;
  use_file: boolean;
  text: string;
  file: string;
  antialiasing: boolean;
  transform: number;
  vertical: boolean;
  color: number;
  /** 0-100 */
  opacity: number;
  gradient: boolean;
  gradient_color: number;
  gradient_opacity: number;
  /** 0-360 */
  gradient_dir: number;
  bk_color: number;
  /** 0-100 */
  bk_opacity: number;
  align: string;
  valign: string;
  outline: boolean;
  outline_size: number;
  outline_color: number;
  /** 0-100 */
  outline_opacity: number;
  chatlog_mode: boolean;
  chatlog_lines: number;
  extents: boolean;
  extents_cx: number;
  extents_cy: number;
  extends_wrap: boolean;
};

export type GDIPlusTextSourcePropertyLists = Pick<
  GDIPlusTextSourceSettings,
  "transform" | "align" | "valign"
>;

export class GDIPlusTextSource<
  Filters extends SourceFilters = {}
> extends Input<GDIPlusTextSourceSettings, Filters> {
  constructor(args: CustomInputArgs<GDIPlusTextSourceSettings, Filters>) {
    super({ ...args, kind: "text_gdiplus_v2" });
  }
}
