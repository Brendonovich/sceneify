import { SourceArgs } from "..";
import { Source, SourceFilters } from "../Source";

type Settings = {
  file: string;
};

export class ImageSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<Settings, Filters> {
  constructor(args: SourceArgs<Settings, Filters>) {
    super({ ...args, type: "image_source" });
  }
}
