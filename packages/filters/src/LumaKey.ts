import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

type LumaKeyFilterSettings = {
  luma_max: number;
  luma_max_smooth: number;
  luma_min: number;
  luma_min_smooth: number;
};

export class LumaKeyFilter<TSource extends Source> extends Filter<
  LumaKeyFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<LumaKeyFilterSettings>) {
    super({
      ...args,
      kind: "luma_key_filter",
    });
  }
}
