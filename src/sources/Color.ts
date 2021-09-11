import { Source } from "../Source";

interface Settings {
  color: number;
  width: number;
  height: number;
}

export class ColorSource extends Source<Settings> {
  type = "color_source";
}
