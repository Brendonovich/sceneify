import {
  CustomSourceArgs,
  Source,
  SourceFilters,
} from "@simple-obs/core";

export type ImageSourceSettings = {
  file: string;
};

export class ImageSource<
  Filters extends SourceFilters = SourceFilters
> extends Source<ImageSourceSettings, Filters> {
  constructor(args: CustomSourceArgs<ImageSourceSettings, Filters>) {
    super({ ...args, type: "image_source" });
  }
}
