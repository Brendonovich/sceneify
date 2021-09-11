import { Source } from "../Source";

interface Settings {
  monitor: number;
  capture_cursor: boolean;
}

export class DisplayCaptureSource extends Source<Settings> {
  type = "monitor_capture";
}
