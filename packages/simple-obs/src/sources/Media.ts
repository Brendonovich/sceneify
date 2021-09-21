import { Source, SourceFilters } from "../Source";

interface Settings {
  local_file: string;
  hw_decode: boolean;
}

export class MediaSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "ffmpeg_source";
}
