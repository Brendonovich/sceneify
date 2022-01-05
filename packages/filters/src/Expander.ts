import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export enum ExpanderDetectorType {
  RMS = "RMS",
  Peak = "peak",
}

export enum ExpanderPreset {
  Expander = "expander",
  Gate = "gate",
}

export type ExpanderFilterSettings = {
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  detector: ExpanderDetectorType;
  presets: ExpanderPreset;
};

export class ExpanderFilter<TSource extends Source> extends Filter<
  ExpanderFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ExpanderFilterSettings>) {
    super({
      ...args,
      kind: "expander_filter",
    });
  }
}
