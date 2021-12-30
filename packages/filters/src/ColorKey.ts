import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export enum ColorKeyColorType {
  Green = "green",
  Blue = "blue",
  Red = "red",
  Magenta = "magenta",
  Custom = "custom",
}

export type ColorKeyFilterSettings = {
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: ColorKeyColorType;
  opacity: number;
  similarity: number;
  smoothness: number;
};

export class ColorKeyFilter<TSource extends Source> extends Filter<
  ColorKeyFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ColorKeyFilterSettings>) {
    super({
      ...args,
      kind: "color_key_filter_v2",
    });
  }
}
