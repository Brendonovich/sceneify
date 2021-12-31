import { Source, SourceFilters, CustomSourceArgs } from "@simple-obs/core";

export type DisplayCaptureSourceSettings = {
  monitor: number;
  capture_cursor: boolean;
};

export class DisplayCaptureSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<DisplayCaptureSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<DisplayCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "monitor_capture",
    });
  }
}
