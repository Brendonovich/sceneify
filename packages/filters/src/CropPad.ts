import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type CropPadFilterSettings = {
  bottom: number;
  left: number;
  relative: boolean;
  right: number;
  rop: number;
};

export class CropPadFilter<TSource extends Source> extends Filter<
  CropPadFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<CropPadFilterSettings>) {
    super({
      ...args,
      kind: "crop_filter",
    });
  }
}
