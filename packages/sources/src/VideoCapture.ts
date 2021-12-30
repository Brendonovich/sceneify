import { Source, SourceFilters, CustomSourceArgs } from "@simple-obs/core";

export type VideoCaptureSourceSettings = {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
};

export class VideoCaptureSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<VideoCaptureSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<VideoCaptureSourceSettings, Filters>) {
    super({
      ...args,
      type: "av_capture_input",
    });
  }
}
