import { Input, SourceFilters, CustomInputArgs } from "@simple-obs/core";

export type DisplayCaptureSourceSettings = {
  monitor: number;
  capture_cursor: boolean;
};

export class DisplayCaptureSource<
  Filters extends SourceFilters = SourceFilters
> extends Input<DisplayCaptureSourceSettings, Filters> {
  constructor(args: CustomInputArgs<DisplayCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "monitor_capture",
    });
  }
}
