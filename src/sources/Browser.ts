import { Source } from "../Source";

interface Settings {
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
}

export class BrowserSource extends Source<Settings> {
  type = "browser_source";
}
