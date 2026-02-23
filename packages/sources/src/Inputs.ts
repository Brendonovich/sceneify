import { InputType } from "@sceneify/core-rewrite";

interface OBSFont {
  face: string;
  flags: number;
  size: number;
  style: string;
}

type OBSVideoRange = 0 | 1 | 2;

export class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
  fps: number;
  fps_custom: boolean;
  reroute_audio: boolean;
  css: string;
  restart_when_active: boolean;
  shutdown: boolean;
  webpage_control_level: number;
}>() {}

export class ColorSource extends InputType("color_source_v3")<{
  color: number;
  width: number;
  height: number;
}>() {}

export class ImageSource extends InputType("image_source")<{
  file: string;
  unload: boolean;
  linear_alpha: boolean;
}>() {}

export class FreetypeTextSource extends InputType("text_ft2_source_v2")<{
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
}>() {}

export class GdiPlusTextSource extends InputType("text_gdiplus_v2")<{
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
}>() {}

export class MediaSource extends InputType("ffmpeg_source")<{
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
  log_changes: boolean;
}>() {}

export class DisplayCaptureSource extends InputType("monitor_capture")<{
  monitor: number;
  compatibility: boolean;
  capture_cursor: boolean;
}>() {}

export class VideoCaptureSource extends InputType("av_capture_input_v2")<{
  color_space: number;
  enable_audio: boolean;
  input_format: number;
  preset: string;
  uid: string;
  use_preset: boolean;
  video_range: number;
}>() {}

export class DecklinkInput extends InputType("decklink-input")<{
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
}>() {}

export class CoreAudioInputCapture extends InputType(
  "coreaudio_input_capture"
)<{
  device_id: string;
  enable_downmix: boolean;
}>() {}

export class MacOSScreenCapture extends InputType("screen_capture")<{
  application: string;
  display_uuid: string;
  hide_obs: boolean;
  show_cursor: boolean;
  show_empty_names: boolean;
  show_hidden_windows: boolean;
  type: number;
  window: number;
}>() {}

export class SlideshowV2 extends InputType("slideshow_v2")<{
  playback_behavior: string;
  playback_mode: string;
  slide_mode: string;
  slide_time: number;
  transition: string;
  transition_speed: number;
  use_custom_size: string;
}>() {}

export class MacOSAVCapture extends InputType("macos-avcapture")<{
  device: string;
  enable_audio: boolean;
  preset: string;
  use_preset: boolean;
}>() {}

export class MacOSAVCaptureFast extends InputType("macos-avcapture-fast")<{
  device: string;
  enable_audio: boolean;
  use_preset: boolean;
}>() {}

export class SCKAudioCapture extends InputType("sck_audio_capture")<{
  application: string;
  type: number;
}>() {}

export class DisplayCapture extends InputType("display_capture")<{
  crop_mode: number;
  display_uuid: string;
  show_cursor: boolean;
  show_empty_names: boolean;
  window: number;
}>() {}

export class WindowCapture extends InputType("window_capture")<{
  show_empty_names: boolean;
  show_shadow: boolean;
  window: number;
}>() {}

export class CoreAudioOutputCapture extends InputType(
  "coreaudio_output_capture"
)<{
  device_id: string;
  enable_downmix: boolean;
}>() {}

export class SyphonInput extends InputType("syphon-input")<{}>() {}
