import { Source, SourceFilters, CustomSourceArgs } from "@simple-obs/core";

export type MediaSourceSettings = {
  local_file: string;
  hw_decode: boolean;
};
export class MediaSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<MediaSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<MediaSourceSettings, Filters>) {
    super({ ...args, type: "ffmpeg_source" });
  }
}
