import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type VideoCaptureSourceSettings = {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
};

export class VideoCaptureSource<
  Filters extends SourceFilters = {}
> extends Input<VideoCaptureSourceSettings, Filters> {
  constructor(args: CustomInputArgs<VideoCaptureSourceSettings, Filters>) {
    super({
      ...args,
      kind: "dshow_input",
    });
  }
}
