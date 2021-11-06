import { Source, SourceFilters } from "../Source";

export class MediaSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    local_file: string;
    hw_decode: boolean;
  },
  F
> {
  type = "ffmpeg_source";
}
