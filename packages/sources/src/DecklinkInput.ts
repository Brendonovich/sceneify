import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type DecklinkInputSettings = {};

export class DecklinkInput<Filters extends SourceFilters = {}> extends Input<
  DecklinkInputSettings,
  Filters
> {
  constructor(args: CustomInputArgs<DecklinkInputSettings, Filters>) {
    super({
      ...args,
      kind: "decklink-input",
    });
  }
}
