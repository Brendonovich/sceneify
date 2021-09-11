import { Source } from "../Source";

interface Settings {
  device: string;
  device_name: string;
  use_preset: boolean;
  buffering: boolean;
}

export class VideoCaptureSource extends Source<Settings> {
  type = "av_capture_input";
}
