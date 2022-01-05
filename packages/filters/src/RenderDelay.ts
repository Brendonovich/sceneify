import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type RenderDelayFilterSettings = {
  delay_ms: number;
};

export class RenderDelayFilter<TSource extends Source> extends Filter<
  RenderDelayFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<RenderDelayFilterSettings>) {
    super({
      ...args,
      kind: "gpu_delay",
    });
  }
}
