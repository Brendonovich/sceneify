import { FilterType } from "@sceneify/core-rewrite";
import { Schema } from "effect";

export class ApplyLUTFilter extends FilterType("clut_filter")({
  image_path: Schema.String,
}) {}

export class AspectRatioFilter extends FilterType("scale_filter")({
  resolution: Schema.String,
  sampling: Schema.String,
}) {}

export class ChromaKeyFilter extends FilterType("chroma_key_filter_v2")({
  brightness: Schema.Number,
  contrast: Schema.Number,
  gamma: Schema.Number,
  key_color: Schema.Number,
  key_color_type: Schema.Literal("green", "blue", "magenta", "custom"),
  opacity: Schema.Number,
  similarity: Schema.Number,
  smoothness: Schema.Number,
  spill: Schema.Number,
}) {}

export class ColorCorrectionFilter extends FilterType("color_filter_v2")({
  brightness: Schema.Number,
  hue_shift: Schema.Number,
}) {}

export class ColorKeyFilter extends FilterType("color_key_filter_v2")({
  brightness: Schema.Number,
  contrast: Schema.Number,
  gamma: Schema.Number,
  key_color: Schema.Number,
  key_color_type: Schema.Literal("green", "blue", "red", "magenta", "custom"),
  opacity: Schema.Number,
  similarity: Schema.Number,
  smoothness: Schema.Number,
}) {}

export class CompressorFilter extends FilterType("compressor_filter")({
  ratio: Schema.Number,
  threshold: Schema.Number,
  attack_time: Schema.Number,
  release_time: Schema.Number,
  output_gain: Schema.Number,
  sidechain_source: Schema.String,
}) {}

export class CropPadFilter extends FilterType("crop_filter")({
  bottom: Schema.Number,
  left: Schema.Number,
  relative: Schema.Boolean,
  right: Schema.Number,
  rop: Schema.Number,
}) {}

export class ExpanderFilter extends FilterType("expander_filter")({
  ratio: Schema.Number,
  threshold: Schema.Number,
  attack_time: Schema.Number,
  release_time: Schema.Number,
  output_gain: Schema.Number,
  detector: Schema.Literal("RMS", "peak"),
  presets: Schema.Literal("expander", "gate"),
}) {}

export class GainFilter extends FilterType("gain_filter")({
  db: Schema.Number,
}) {}

export class ImageMaskBlendFilter extends FilterType("mask_filter_v2")({
  image_path: Schema.String,
  type: Schema.Literal(
    "mask_alpha_filter.effect",
    "mask_colour_filter.effect",
    "blend_mul_filter.effect",
    "blend_add_filter.effect",
    "blend_sub_filter.effect"
  ),
}) {}

export class InvertPolarityFilter extends FilterType("invert_polarity_filter")(
  {}
) {}

export class LimiterFilter extends FilterType("limiter_filter")({
  threshold: Schema.Number,
  release_time: Schema.Number,
}) {}

export class LumaKeyFilter extends FilterType("luma_key_filter")({
  luma_max: Schema.Number,
  luma_max_smooth: Schema.Number,
  luma_min: Schema.Number,
  luma_min_smooth: Schema.Number,
}) {}

export class NoiseGateFilter extends FilterType("noise_gate_filter")({
  open_threshold: Schema.Number,
  close_threshold: Schema.Number,
  attack_time: Schema.Number,
  hold_time: Schema.Number,
  release_time: Schema.Number,
}) {}

export class NoiseSuppressFilter extends FilterType("noise_suppress_filter_v2")(
  {
    method: Schema.Literal("speex", "rnnoise", "nvafx"),
  }
) {}

export class RenderDelayFilter extends FilterType("gpu_delay")({
  delay_ms: Schema.Number,
}) {}

export class ScrollFilter extends FilterType("scroll_filter")({
  limit_cx: Schema.Boolean,
  limit_cy: Schema.Boolean,
  loop: Schema.Boolean,
  speed_x: Schema.Number,
  speed_y: Schema.Number,
}) {}

export class SharpenFilter extends FilterType("sharpness_filter_v2")({
  sharpness: Schema.Number,
}) {}
