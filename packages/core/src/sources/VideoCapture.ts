import { Source, SourceFilters, CustomSourceArgs } from "../Source";

type Settings = {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
};

export class VideoCaptureSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: CustomSourceArgs<Settings, Filters>) {
    super({
      ...args,
      type: "av_capture_input",
    });
  }
}
