import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type VideoCaptureSourceSettings = {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
  enable_audio: boolean;
};

export type VideoCaptureSourcePropertyLists = Pick<
  VideoCaptureSourceSettings,
  "device"
>;

export class VideoCaptureSource<
  Filters extends SourceFilters = {}
> extends Input<
  VideoCaptureSourceSettings,
  Filters,
  VideoCaptureSourcePropertyLists
> {
  constructor(args: CustomInputArgs<VideoCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "av_capture_input_v2",
    });
  }
}
