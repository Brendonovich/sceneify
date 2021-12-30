import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export type ApplyLUTFilterSettings = {
  image_path: string;
};

export class ApplyLUTFilter<TSource extends Source> extends Filter<
  ApplyLUTFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ApplyLUTFilterSettings>) {
    super({
      ...args,
      kind: "clut_filter",
    });
  }
}
