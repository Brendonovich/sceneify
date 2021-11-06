import { Source, SourceFilters } from "../Source";

export class DisplayCaptureSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    monitor: number;
    capture_cursor: boolean;
  },
  F
> {
  type = "monitor_capture";
}
