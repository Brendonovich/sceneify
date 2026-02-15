import { FilterType } from "@sceneify/core-rewrite";

export class ApplyLUTFilter extends FilterType("clut_filter")<{
  image_path: string;
}>() {}

export class AspectRatioFilter extends FilterType("scale_filter")<{
  resolution: string;
  sampling: string;
}>() {}

export class ChromaKeyFilter extends FilterType("chroma_key_filter_v2")<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: "green" | "blue" | "magenta" | "custom";
  opacity: number;
  similarity: number;
  smoothness: number;
  spill: number;
}>() {}

export class ColorCorrectionFilter extends FilterType("color_filter_v2")<{
  brightness: number;
  hue_shift: number;
}>() {}

export class ColorKeyFilter extends FilterType("color_key_filter_v2")<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: "green" | "blue" | "red" | "magenta" | "custom";
  opacity: number;
  similarity: number;
  smoothness: number;
}>() {}

export class CompressorFilter extends FilterType("compressor_filter")<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  sidechain_source: string;
}>() {}

export class CropPadFilter extends FilterType("crop_filter")<{
  bottom: number;
  left: number;
  relative: boolean;
  right: number;
  rop: number;
}>() {}

export class ExpanderFilter extends FilterType("expander_filter")<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  detector: "RMS" | "peak";
  presets: "expander" | "gate";
}>() {}

export class GainFilter extends FilterType("gain_filter")<{
  db: number;
}>() {}

export class ImageMaskBlendFilter extends FilterType("mask_filter_v2")<{
  image_path: string;
  type:
    | "mask_alpha_filter.effect"
    | "mask_colour_filter.effect"
    | "blend_mul_filter.effect"
    | "blend_add_filter.effect"
    | "blend_sub_filter.effect";
}>() {}

export class InvertPolarityFilter extends FilterType(
  "invert_polarity_filter"
)<{}>() {}

export class LimiterFilter extends FilterType("limiter_filter")<{
  threshold: number;
  release_time: number;
}>() {}

export class LumaKeyFilter extends FilterType("luma_key_filter")<{
  luma_max: number;
  luma_max_smooth: number;
  luma_min: number;
  luma_min_smooth: number;
}>() {}

export class NoiseGateFilter extends FilterType("noise_gate_filter")<{
  open_threshold: number;
  close_threshold: number;
  attack_time: number;
  hold_time: number;
  release_time: number;
}>() {}

export class NoiseSuppressFilter extends FilterType(
  "noise_suppress_filter_v2"
)<{ method: "speex" | "rnnoise" | "nvafx" }>() {}

export class RenderDelayFilter extends FilterType("gpu_delay")<{
  delay_ms: number;
}>() {}

export class ScrollFilter extends FilterType("scroll_filter")<{
  limit_cx: boolean;
  limit_cy: boolean;
  loop: boolean;
  speed_x: number;
  speed_y: number;
}>() {}

export class SharpenFilter extends FilterType("sharpness_filter_v2")<{
  sharpness: number;
}>() {}
