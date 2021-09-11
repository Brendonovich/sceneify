import { Source } from "../Source";

interface Settings {
  text: string;
  font: {
    face: string;
    flags: number;
    size: number;
    style: string;
  };
  antialiasing: boolean;
  color1: number;
  color2: number;
}

export class FreetypeTextSource extends Source<Settings> {
  type = "text_ft2_source_v2";
}
