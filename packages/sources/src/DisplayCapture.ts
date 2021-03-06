import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type DisplayCaptureSourceSettings = {
  monitor: number;
  capture_cursor: boolean;
};

export class DisplayCaptureSource<
  Filters extends SourceFilters = {}
> extends Input<DisplayCaptureSourceSettings, Filters> {
  constructor(args: CustomInputArgs<DisplayCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "monitor_capture",
    });
  }
}
