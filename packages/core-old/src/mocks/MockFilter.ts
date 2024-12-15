import { CustomFilterArgs, Filter } from "../Filter";
import { Source } from "../Source";

export interface MockFilterSettings {
  a: number;
  b: string;
}

export class MockFilter<TSource extends Source> extends Filter<
  MockFilterSettings,
  TSource
> {
  constructor(args: CustomFilterArgs<MockFilterSettings>) {
    super({
      ...args,
      kind: "mock",
    });
  }
}
