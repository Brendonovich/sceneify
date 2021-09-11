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
  color: number;
  read_from_file: boolean;
  file: string;
}

export class GDIPlusTextSource extends Source<Settings> {
  type = "text_gdiplus_v2";
}
