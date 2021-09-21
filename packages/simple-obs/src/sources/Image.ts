import { Source, SourceFilters } from "../Source";

interface Settings {
  file: string;
}

export class ImageSource<
  F extends SourceFilters = SourceFilters
> extends Source<Settings, F> {
  type = "image_source";
}
