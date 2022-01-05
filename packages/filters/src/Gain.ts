import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type GainFilterSettings = { db: number };

export class GainFilter<TSource extends Source> extends Filter<
  GainFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<GainFilterSettings>) {
    super({
      ...args,
      kind: "gain_filter",
    });
  }
}
