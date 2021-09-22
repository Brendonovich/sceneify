import { Source, SourceFilters } from "../Source";

export class ImageSource<
  F extends SourceFilters = SourceFilters
> extends Source<
  {
    file: string;
  },
  F
> {
  type = "image_source";
}
