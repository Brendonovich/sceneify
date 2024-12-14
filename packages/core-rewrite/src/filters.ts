import { defineFilterType } from "./definition.ts";

export const applyLUTFilter = defineFilterType("clut_filter").settings<{
  image_path: string;
}>();

export const aspectRatioFilter = defineFilterType("scale_filter").settings<{
  resolution: string;
  sampling: string;
}>();

export const chromaKeyFilter = defineFilterType(
  "chroma_key_filter_v2"
).settings<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: "green" | "blue" | "magenta" | "custom";
  opacity: number;
  similarity: number;
  smoothness: number;
  spill: number;
}>();

export const colorCorrectionFilter = defineFilterType(
  "color_filter_v2"
).settings<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: "green" | "blue" | "magenta" | "custom";
  opacity: number;
  similarity: number;
  smoothness: number;
  spill: number;
}>();

export const colorKeyFilter = defineFilterType("color_key_filter_v2").settings<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: "green" | "blue" | "red" | "magenta" | "custom";
  opacity: number;
  similarity: number;
  smoothness: number;
}>();

export const compressorFilter = defineFilterType("compressor_filter").settings<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  sidechain_source: string;
}>();

export const cropPadFilter = defineFilterType("crop_filter").settings<{
  bottom: number;
  left: number;
  relative: boolean;
  right: number;
  rop: number;
}>();

export const expanderFilter = defineFilterType("expander_filter").settings<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  detector: "RMS" | "peak";
  presets: "expander" | "gate";
}>();

export const gainFilter = defineFilterType("gain_filter").settings<{
  db: number;
}>();

export const imageMaskBlendFilter = defineFilterType(
  "mask_filter_v2"
).settings<{
  image_path: string;
  type:
    | "mask_alpha_filter.effect"
    | "mask_colour_filter.effect"
    | "blend_mul_filter.effect"
    | "blend_add_filter.effect"
    | "blend_sub_filter.effect";
}>();

export const invertPolarityFilter = defineFilterType("invert_polarity_filter");

export const limiterFilter = defineFilterType("limiter_filter").settings<{
  threshold: number;
  release_time: number;
}>();

export const lumaKeyFilter = defineFilterType("luma_key_filter").settings<{
  luma_max: number;
  luma_max_smooth: number;
  luma_min: number;
  luma_min_smooth: number;
}>();

export const noiseGateFilter = defineFilterType("noise_gate_filter").settings<{
  open_threshold: number;
  close_threshold: number;
  attack_time: number;
  hold_time: number;
  release_time: number;
}>();

export const noiseSuppressFilter = defineFilterType(
  "noise_suppress_filter_v2"
).settings<{ method: "speex" | "rnnoise" | "nvafx" }>();

export const renderDelayFilter = defineFilterType("gpu_delay").settings<{
  delay_ms: number;
}>();

export const scrollFilter = defineFilterType("scroll_filter").settings<{
  limit_cx: boolean;
  limit_cy: boolean;
  loop: boolean;
  speed_x: number;
  speed_y: number;
}>();

export const sharpenFilter = defineFilterType("sharpness_filter_v2").settings<{
  sharpness: number;
}>();
