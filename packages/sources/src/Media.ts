import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type MediaSourceSettings = {
  local_file: string;
  hw_decode: boolean;
};
export class MediaSource<Filters extends SourceFilters = {}> extends Input<
  MediaSourceSettings,
  Filters
> {
  constructor(args: CustomInputArgs<MediaSourceSettings, Filters>) {
    super({ ...args, kind: "ffmpeg_source" });
  }
}
