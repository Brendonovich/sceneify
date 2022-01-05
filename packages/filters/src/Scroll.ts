import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type ScrollFilterSettings = {
  limit_cx: boolean;
  limit_cy: boolean;
  loop: boolean;
  speed_x: number;
  speed_y: number;
};

export class ScrollFilter<TSource extends Source> extends Filter<
  ScrollFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ScrollFilterSettings>) {
    super({
      ...args,
      kind: "scroll_filter",
    });
  }
}
