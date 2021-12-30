import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export enum MaskBlendType {
  AlphaMaskAlphaChannel = "mask_alpha_filter.effect",
  AlphaMaskColourChannel = "mask_colour_filter.effect",
  BlendMultiply = "blend_mul_filter.effect",
  BlendAddition = "blend_add_filter.effect",
  BlendSubtraction = "blend_sub_filter.effect",
}

export type ImageMaskBlendFilterSettings = {
  image_path: string;
  type: MaskBlendType;
};

export class ImageMaskBlendFilter<TSource extends Source> extends Filter<
  ImageMaskBlendFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ImageMaskBlendFilterSettings>) {
    super({
      ...args,
      kind: "mask_filter_v2",
    });
  }
}
