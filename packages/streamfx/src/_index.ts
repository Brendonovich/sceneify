import { CustomFilterArgs, Filter, Source } from "@sceneify/core";

export type BlurFilterSettings = {
	"Filter.Blur.Type": string,
	"Filter.Blur.Subtype": string,
	"Filter.Blur.Size": number
}

export class BlurFilter<TSource extends Source> extends Filter<
	BlurFilterSettings,
	TSource
> {
	constructor(args: CustomFilterArgs<BlurFilterSettings>) {
		super({
			...args,
			kind: "streamfx-filter-blur",
		});
	}
}
