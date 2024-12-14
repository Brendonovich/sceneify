import { defineInputType } from "./definition.ts";
import { OBSFont, OBSVideoRange } from "./obs-types.ts";

export const browserSource = defineInputType("browser_source").settings<{
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
  css: string;
}>();

export const colorSource = defineInputType("color_source_v3").settings<{
  color: number;
  width: number;
  height: number;
}>();

export const imageSource = defineInputType("image_source").settings<{
  file: string;
  unload: boolean;
  linear_alpha: boolean;
}>();

export const freetypeTextSource = defineInputType(
  "text_ft2_source_v2"
).settings<{
  font: OBSFont;
  text: string;
  from_file: boolean;
  antialiasing: boolean;
  log_mode: boolean;
  log_lines: number;
  text_file: string;
  color1: number;
  color2: number;
  outline: boolean;
  drop_shadow: boolean;
  custom_width: number;
  word_wrap: boolean;
}>();

export const gdiPlusTextSource = defineInputType("text_gdiplus_v2").settings<{
  font: OBSFont;
  use_file: boolean;
  text: string;
  file: string;
  antialiasing: boolean;
  transform: 0 | 1 | 2 | 3;
  vertical: boolean;
  color: number;
  /** 0-100 */
  opacity: number;
  gradient: boolean;
  gradient_color: number;
  gradient_opacity: number;
  /** 0-360 */
  gradient_dir: number;
  bk_color: number;
  /** 0-100 */
  bk_opacity: number;
  align: "left" | "center" | "right";
  valign: "top" | "center" | "bottom";
  outline: boolean;
  outline_size: number;
  outline_color: number;
  /** 0-100 */
  outline_opacity: number;
  chatlog_mode: boolean;
  chatlog_lines: number;
  extents: boolean;
  extents_cx: number;
  extents_cy: number;
  extends_wrap: boolean;
}>();

export const mediaSource = defineInputType("ffmpeg_source").settings<{
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
  color_range: OBSVideoRange;
  linear_alpha: boolean;
  seekable: boolean;
}>();

export const displayCaptureSource = defineInputType(
  "monitor_capture"
).settings<{
  monitor: number;
  compatibility: boolean;
  capture_cursor: boolean;
}>();

export const videoCaptureSource = defineInputType(
  "av_capture_input_v2"
).settings<{ device: string; device_name: string }>();

export const decklinkInput = defineInputType("decklink-input").settings<{
  device_name: string;
  device_hash: string;
  video_connection: number;
  audio_connection: number;
  mode_id: number;
  pixel_format: 0x32767579 | 0x76323130 | 0x42475241;
  color_space: 0 | 1 | 2;
  color_range: OBSVideoRange;
  channel_format: 0 | 2 | 3 | 4 | 5 | 6 | 8;
  swap: boolean;
  buffering: boolean;
  deactivate_when_not_showing: boolean;
  allow_10_bit: boolean;
}>();

export const coreAudioInputCapture = defineInputType(
  "coreaudio_input_capture"
).settings<{
  device_id: string;
  enable_downmix: boolean;
}>();

export const macOSScreenCapture = defineInputType("screen_capture").settings<{
  application: string;
  display_uuid: string;
  hide_obs: boolean;
  show_cursor: boolean;
  show_empty_names: boolean;
  show_hidden_windows: boolean;
  type: number;
  window: number;
}>();
