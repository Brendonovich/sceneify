import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type ColorCorrectionFilterSettings = {
  brightness: number;
  color_add: number;
  color_multiply: number;
  contrast: number;
  gamma: number;
  hue_shift: number;
  opacity: number;
  saturation: number;
};

export class ColorCorrectionFilter<TSource extends Source> extends Filter<
  ColorCorrectionFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ColorCorrectionFilterSettings>) {
    super({
      ...args,
      kind: "color_filter_v2",
    });
  }
}
