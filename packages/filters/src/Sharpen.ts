import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export type SharpenFilterSettings = {
  sharpness: number;
};

export class SharpenFilter<TSource extends Source> extends Filter<
  SharpenFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<SharpenFilterSettings>) {
    super({
      ...args,
      kind: "sharpness_filter_v2",
    });
  }
}
