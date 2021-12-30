import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export type LimiterFilterSettings = {
  threshold: number;
  release_time: number;
};

export class LimiterFilter<TSource extends Source> extends Filter<
  LimiterFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<LimiterFilterSettings>) {
    super({
      ...args,
      kind: "limiter_filter",
    });
  }
}
