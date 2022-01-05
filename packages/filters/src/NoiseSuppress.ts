import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export enum NoiseSuppressMethod {
  Speex = "speex",
  RNNoise = "rnnoise",
  NVAFX = "nvafx",
}

export type NoiseSuppressFilterSettings = {
  method: NoiseSuppressMethod;
};

export class NoiseSuppressFilter<TSource extends Source> extends Filter<
  NoiseSuppressFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<NoiseSuppressFilterSettings>) {
    super({
      ...args,
      kind: "noise_suppress_filter",
    });
  }
}
