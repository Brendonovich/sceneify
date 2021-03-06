import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type AspectRatioFilterSettings = {
  resolution: string;
  sampling: string;
};

export class AspectRatioFilter<TSource extends Source> extends Filter<
  AspectRatioFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<AspectRatioFilterSettings>) {
    super({
      ...args,
      kind: "scale_filter",
    });
  }
}
