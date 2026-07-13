import { InputType } from "@sceneify/core-rewrite";
import { Schema } from "effect";

const OBSFont = Schema.Struct({
  face: Schema.String,
  flags: Schema.Number,
  size: Schema.Number,
  style: Schema.String,
});

const OBSVideoRange = Schema.Literal(0, 1, 2);

export class BrowserSource extends InputType("browser_source")({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
  fps: Schema.Number,
  fps_custom: Schema.Boolean,
  reroute_audio: Schema.Boolean,
  css: Schema.String,
  restart_when_active: Schema.Boolean,
  shutdown: Schema.Boolean,
  webpage_control_level: Schema.Number,
}) {}

export class ColorSource extends InputType("color_source_v3")({
  color: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
}) {}

export class ImageSource extends InputType("image_source")({
  file: Schema.String,
  unload: Schema.Boolean,
  linear_alpha: Schema.Boolean,
}) {}

export class FreetypeTextSource extends InputType("text_ft2_source_v2")({
  font: OBSFont,
  text: Schema.String,
  from_file: Schema.Boolean,
  antialiasing: Schema.Boolean,
  log_mode: Schema.Boolean,
  log_lines: Schema.Number,
  text_file: Schema.String,
  color1: Schema.Number,
  color2: Schema.Number,
  outline: Schema.Boolean,
  drop_shadow: Schema.Boolean,
  custom_width: Schema.Number,
  word_wrap: Schema.Boolean,
}) {}

export class GdiPlusTextSource extends InputType("text_gdiplus_v2")({
  font: OBSFont,
  use_file: Schema.Boolean,
  text: Schema.String,
  file: Schema.String,
  antialiasing: Schema.Boolean,
  transform: Schema.Literal(0, 1, 2, 3),
  vertical: Schema.Boolean,
  color: Schema.Number,
  opacity: Schema.Number,
  gradient: Schema.Boolean,
  gradient_color: Schema.Number,
  gradient_opacity: Schema.Number,
  gradient_dir: Schema.Number,
  bk_color: Schema.Number,
  bk_opacity: Schema.Number,
  align: Schema.Literal("left", "center", "right"),
  valign: Schema.Literal("top", "center", "bottom"),
  outline: Schema.Boolean,
  outline_size: Schema.Number,
  outline_color: Schema.Number,
  outline_opacity: Schema.Number,
  chatlog_mode: Schema.Boolean,
  chatlog_lines: Schema.Number,
  extents: Schema.Boolean,
  extents_cx: Schema.Number,
  extents_cy: Schema.Number,
  extends_wrap: Schema.Boolean,
}) {}

export class MediaSource extends InputType("ffmpeg_source")({
  is_local_file: Schema.Boolean,
  local_file: Schema.String,
  looping: Schema.Boolean,
  restart_on_activate: Schema.Boolean,
  buffering_mb: Schema.Number,
  input: Schema.String,
  input_format: Schema.String,
  reconnect_delay_sec: Schema.Number,
  hw_decode: Schema.Boolean,
  clear_on_media_end: Schema.Boolean,
  close_when_inactive: Schema.Boolean,
  speed_percent: Schema.Number,
  color_range: OBSVideoRange,
  linear_alpha: Schema.Boolean,
  seekable: Schema.Boolean,
  log_changes: Schema.Boolean,
}) {}

export class DisplayCaptureSource extends InputType("monitor_capture")({
  monitor: Schema.Number,
  compatibility: Schema.Boolean,
  capture_cursor: Schema.Boolean,
}) {}

export class VideoCaptureSource extends InputType("av_capture_input_v2")({
  color_space: Schema.Number,
  enable_audio: Schema.Boolean,
  input_format: Schema.Number,
  preset: Schema.String,
  uid: Schema.String,
  use_preset: Schema.Boolean,
  video_range: Schema.Number,
}) {}

export class DecklinkInput extends InputType("decklink-input")({
  device_name: Schema.String,
  device_hash: Schema.String,
  video_connection: Schema.Number,
  audio_connection: Schema.Number,
  mode_id: Schema.Number,
  pixel_format: Schema.Literal(0x32767579, 0x76323130, 0x42475241),
  color_space: Schema.Literal(0, 1, 2),
  color_range: OBSVideoRange,
  channel_format: Schema.Literal(0, 2, 3, 4, 5, 6, 8),
  swap: Schema.Boolean,
  buffering: Schema.Boolean,
  deactivate_when_not_showing: Schema.Boolean,
  allow_10_bit: Schema.Boolean,
}) {}

export class CoreAudioInputCapture extends InputType("coreaudio_input_capture")(
  {
    device_id: Schema.String,
    enable_downmix: Schema.Boolean,
  }
) {}

export class MacOSScreenCapture extends InputType("screen_capture")({
  application: Schema.String,
  display_uuid: Schema.String,
  hide_obs: Schema.Boolean,
  show_cursor: Schema.Boolean,
  show_empty_names: Schema.Boolean,
  show_hidden_windows: Schema.Boolean,
  type: Schema.Number,
  window: Schema.Number,
}) {}

export class SlideshowV2 extends InputType("slideshow_v2")({
  playback_behavior: Schema.String,
  playback_mode: Schema.String,
  slide_mode: Schema.String,
  slide_time: Schema.Number,
  transition: Schema.String,
  transition_speed: Schema.Number,
  use_custom_size: Schema.String,
}) {}

export class MacOSAVCapture extends InputType("macos-avcapture")({
  device: Schema.String,
  enable_audio: Schema.Boolean,
  preset: Schema.String,
  use_preset: Schema.Boolean,
}) {}

export class MacOSAVCaptureFast extends InputType("macos-avcapture-fast")({
  device: Schema.String,
  enable_audio: Schema.Boolean,
  use_preset: Schema.Boolean,
}) {}

export class SCKAudioCapture extends InputType("sck_audio_capture")({
  application: Schema.String,
  type: Schema.Number,
}) {}

export class DisplayCapture extends InputType("display_capture")({
  crop_mode: Schema.Number,
  display_uuid: Schema.String,
  show_cursor: Schema.Boolean,
  show_empty_names: Schema.Boolean,
  window: Schema.Number,
}) {}

export class WindowCapture extends InputType("window_capture")({
  show_empty_names: Schema.Boolean,
  show_shadow: Schema.Boolean,
  window: Schema.Number,
}) {}

export class CoreAudioOutputCapture extends InputType(
  "coreaudio_output_capture"
)({
  device_id: Schema.String,
  enable_downmix: Schema.Boolean,
}) {}

export class SyphonInput extends InputType("syphon-input")({}) {}
