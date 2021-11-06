import { Source, SourceFilters } from "../Source";

export class VideoCaptureSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    device: string;
    device_name: string;
    use_preset: boolean;
    buffering: boolean;
  },
  F
> {
  type = "av_capture_input";
}
