import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export enum PixelFormat {
  YUV8Bit = 0x32767579,
  YUV10Bit = 0x76323130,
  BGRA8Bit = 0x42475241,
}

export enum ColorSpace {
  Default = 0,
  BT601 = 1,
  BT709 = 2,
}

export enum VideoRange {
  Default = 0,
  Partial = 1,
  Full = 2,
}

export enum ChannelFormat {
  None = 0,
  Stereo = 2,
  TwoPointOne = 3,
  FourPointZero = 4,
  FourPointOne = 5,
  FivePointOne = 6,
  SevenPointOne = 8,
}

export type DecklinkInputSettings = {
  device_hash: string;
  video_connection: number;
  audio_connection: number;
  mode_id: number;
  pixel_format: PixelFormat;
  color_space: ColorSpace;
  color_range: number;
  channel_format: number;
  swap: boolean;
  buffering: boolean;
  deactivate_when_not_showing: boolean;
  allow_10_bit: boolean;
};

export class DecklinkInput<Filters extends SourceFilters = {}> extends Input<
  DecklinkInputSettings,
  Filters
> {
  constructor(args: CustomInputArgs<DecklinkInputSettings, Filters>) {
    super({
      ...args,
      kind: "decklink-input",
    });
  }
}
