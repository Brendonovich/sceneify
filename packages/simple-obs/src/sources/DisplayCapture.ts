import { Source, SourceFilters } from "../Source";

interface Settings {
  monitor: number;
  capture_cursor: boolean;
}

export class DisplayCaptureSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "monitor_capture";
}
