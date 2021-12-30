import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export type CompressorFilterSettings = {
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  sidechain_source: string;
};

export class CompressorFilter<TSource extends Source> extends Filter<
  CompressorFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<CompressorFilterSettings>) {
    super({
      ...args,
      kind: "compressor_filter",
    });
  }
}
