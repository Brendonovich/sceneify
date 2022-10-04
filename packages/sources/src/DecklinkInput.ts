import {
  Input,
  SourceFilters,
  CustomInputArgs,
  VideoRange,
} from "@sceneify/core";

export const DecklinkPixelFormat = {
  YUV8Bit: 0x32767579,
  YUV10Bit: 0x76323130,
  BGRA8Bit: 0x42475241,
};

export const DecklinkColorSpace = {
  Default: 0,
  BT601: 1,
  BT709: 2,
};

export const DecklinkChannelFormat = {
  None: 0,
  Stereo: 2,
  TwoPointOne: 3,
  FourPointZero: 4,
  FourPointOne: 5,
  FivePointOne: 6,
  SevenPointOne: 8,
};

export type DecklinkInputSettings = {
  device_name: string;
  device_hash: string;
  video_connection: number;
  audio_connection: number;
  mode_id: number;
  pixel_format: number;
  color_space: number;
  color_range: VideoRange;
  channel_format: number;
  swap: boolean;
  buffering: boolean;
  deactivate_when_not_showing: boolean;
  allow_10_bit: boolean;
};

export type DecklinkInputPropertyLists = Pick<
  DecklinkInputSettings,
  | "device_hash"
  | "video_connection"
  | "audio_connection"
  | "mode_id"
  | "pixel_format"
  | "color_space"
  | "channel_format"
>;

export class DecklinkInput<Filters extends SourceFilters = {}> extends Input<
  DecklinkInputSettings,
  Filters,
  DecklinkInputPropertyLists
> {
  constructor(args: CustomInputArgs<DecklinkInputSettings, Filters>) {
    super({
      ...args,
      kind: "decklink-input",
    });
  }
}
