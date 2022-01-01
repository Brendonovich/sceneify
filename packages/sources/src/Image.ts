import {
  CustomInputArgs,
  Input,
  SourceFilters,
} from "@simple-obs/core";

export type ImageSourceSettings = {
  file: string;
};

export class ImageSource<
  Filters extends SourceFilters = SourceFilters
> extends Input<ImageSourceSettings, Filters> {
  constructor(args: CustomInputArgs<ImageSourceSettings, Filters>) {
    super({ ...args, kind: "image_source" });
  }
}
