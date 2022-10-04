import {
  Input,
  SourceFilters,
  CustomInputArgs,
  OBSEventTypes,
  OBS,
  VideoRange,
} from "@sceneify/core";
import { EventEmitter } from "eventemitter3";

export type MediaSourceSettings = {
  is_local_file: boolean;
  local_file: string;
  looping: boolean;
  restart_on_activate: boolean;
  buffering_mb: number;
  input: string;
  input_format: string;
  reconnect_delay_sec: number;
  hw_decode: boolean;
  clear_on_media_end: boolean;
  close_when_inactive: boolean;
  speed_percent: number;
  color_range: VideoRange;
  linear_alpha: boolean;
  seekable: boolean;
};

export interface MediaSourceEvents {
  PlaybackStarted: void;
  PlaybackEnded: void;
}

export class MediaSource<Filters extends SourceFilters = {}> extends Input<
  MediaSourceSettings,
  Filters
> {
  private emitter = new EventEmitter();

  constructor(args: CustomInputArgs<MediaSourceSettings, Filters>) {
    super({ ...args, kind: "ffmpeg_source" });
  }

  private emit(event: keyof MediaSourceEvents) {
    this.emitter.emit(event);
  }

  startedListener = (args: OBSEventTypes["MediaInputPlaybackStarted"]) => {
    if (this.name === args.inputName) {
      this.emit("PlaybackStarted");
    }
  };

  endedListener = (args: OBSEventTypes["MediaInputPlaybackEnded"]) => {
    if (this.name === args.inputName) {
      this.emit("PlaybackEnded");
    }
  };

  override async initialize(obs: OBS) {
    await super.initialize(obs);
    obs.on("MediaInputPlaybackStarted", this.startedListener);
    obs.on("MediaInputPlaybackEnded", this.endedListener);
  }

  override async remove() {
    await super.remove();

    this.obs.off("MediaInputPlaybackStarted", this.startedListener);
    this.obs.off("MediaInputPlaybackEnded", this.endedListener);
  }

  on(event: keyof MediaSourceEvents, fn: () => void) {
    return this.emitter.on(event, fn);
  }

  off(event: keyof MediaSourceEvents, fn: () => void) {
    return this.emitter.off(event, fn);
  }

  once(event: keyof MediaSourceEvents, fn: () => void) {
    return this.emitter.once(event, fn);
  }
}
