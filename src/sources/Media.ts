import { Source } from "../Source";

interface Settings {
  local_file: string;
  hw_decode: boolean;
}

export class MediaSource extends Source<Settings> {
  type = "ffmpeg_source";
}
