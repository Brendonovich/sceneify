import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export enum ChromaKeyColorType {
  Green = "green",
  Blue = "blue",
  Magenta = "magenta",
  Custom = "custom",
}

export type ChromaKeyFilterSettings = {
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: ChromaKeyColorType;
  opacity: number;
  similarity: number;
  smoothness: number;
  spill: number;
};

export class ChromaKeyFilter<TSource extends Source> extends Filter<
  ChromaKeyFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<ChromaKeyFilterSettings>) {
    super({
      ...args,
      kind: "chroma_key_filter_v2",
    });
  }
}
