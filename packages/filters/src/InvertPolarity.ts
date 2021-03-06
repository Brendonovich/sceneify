import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export class InvertPolarityFilter<TSource extends Source> extends Filter<
  {},
  TSource
> {
  constructor(args: CustomFilterArgs<{}>) {
    super({
      ...args,
      kind: "gain_filter",
    });
  }
}
