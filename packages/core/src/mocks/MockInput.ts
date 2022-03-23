import { CustomInputArgs, Input } from "../Input";
import { SourceFilters } from "../Source";

export interface MockInputSettings {
  a: number;
  b: string;
}

export class MockInput<
  F extends SourceFilters
> extends Input<MockInputSettings> {
  constructor(args: CustomInputArgs<MockInputSettings, F>) {
    super({
      ...args,
      kind: "mock",
    });
  }
}
