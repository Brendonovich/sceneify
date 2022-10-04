import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type DisplayCaptureSourceSettings = {
  monitor: number;
  compatibility: boolean;
  capture_cursor: boolean;
};

export type DisplayCaptureSourcePropertyLists = Pick<
  DisplayCaptureSourceSettings,
  "monitor"
>;

/**
 * Only available on Windows
 */
export class DisplayCaptureSource<
  Filters extends SourceFilters = {}
> extends Input<
  DisplayCaptureSourceSettings,
  Filters,
  DisplayCaptureSourcePropertyLists
> {
  constructor(args: CustomInputArgs<DisplayCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "monitor_capture",
    });
  }
}
