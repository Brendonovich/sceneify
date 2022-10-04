import { Input, SourceFilters, CustomInputArgs } from "@sceneify/core";

export type MacAudioInputCaptureSettings = {
  device_id: string;
};

export type MacAudioInputCapturePropertyLists = Pick<
  MacAudioInputCaptureSettings,
  "device_id"
>;

export class MacAudioInputCapture<
  Filters extends SourceFilters = {}
> extends Input<
  MacAudioInputCaptureSettings,
  Filters,
  MacAudioInputCapturePropertyLists
> {
  constructor(args: CustomInputArgs<MacAudioInputCaptureSettings, Filters>) {
    super({
      ...args,
      kind: "coreaudio_input_capture",
    });
  }
}
