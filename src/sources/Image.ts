import { Source } from "../Source";

interface Settings {
  file: string;
}

export class ImageSource extends Source<Settings> {
  type = "image_source";
}
