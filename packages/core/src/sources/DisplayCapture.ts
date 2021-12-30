import { CustomSourceArgs } from "..";
import { Source, SourceFilters } from "../Source";

type Settings = {
  monitor: number;
  capture_cursor: boolean;
};

export class DisplayCaptureSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: CustomSourceArgs<Settings, Filters>) {
    super({
      ...args,
      type: "monitor_capture",
    });
  }
}
