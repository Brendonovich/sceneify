import { CustomFilterArgs, Filter, Source } from "@simple-obs/core";

export type NoiseGateFilterSettings = {
  open_threshold: number;
  close_threshold: number;
  attack_time: number;
  hold_time: number;
  release_time: number;
};

export class NoiseGateFilter<TSource extends Source> extends Filter<
  NoiseGateFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<NoiseGateFilterSettings>) {
    super({
      ...args,
      kind: "noise_gate_filter",
    });
  }
}
