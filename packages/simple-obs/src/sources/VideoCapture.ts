import { Source, SourceFilters } from "../Source";

interface Settings {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
}

export class VideoCaptureSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "av_capture_input";
}
