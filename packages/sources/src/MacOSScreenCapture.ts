import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export enum MacOSCaptureType {
  Display = 0,
  Window = 1,
  Application = 2,
}

export type MacOSScreenCaptureSettings = {
  type: MacOSCaptureType;
  display: number;
  application: string;
  window: number;
  show_empty_names: boolean;
  show_cursor: boolean;
};

export type MacOSScreenCapturePropertyLists = Pick<
  MacOSScreenCaptureSettings,
  "display" | "application" | "window"
>;

export class MacOSScreenCapture<
  Filters extends SourceFilters = {}
> extends Input<
  MacOSScreenCaptureSettings,
  Filters,
  MacOSScreenCapturePropertyLists
> {
  constructor(args: CustomInputArgs<MacOSScreenCaptureSettings, Filters>) {
    super({
      ...args,
      kind: "screen_capture",
    });
  }
}
