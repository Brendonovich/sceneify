import { CustomSourceArgs, Source, SourceFilters } from "../Source";

type Settings = {
  local_file: string;
  hw_decode: boolean;
};
export class MediaSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: CustomSourceArgs<Settings, Filters>) {
    super({ ...args, type: "ffmpeg_source" });
  }
}
