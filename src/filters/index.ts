import { filterType, t } from "..";

export const CropPadFilter = filterType("crop_filter", {
  bottom: t.number(),
  left: t.number(),
  relative: t.boolean(),
  right: t.number(),
  rop: t.number(),
});

export const LumaKeyFilter = filterType("luma_key_filter_v2", {
  luma_max: t.number(),
  luma_max_smooth: t.number(),
  luma_min: t.number(),
  luma_min_smooth: t.number(),
});

export const ApplyLUTFilter = filterType("clut_filter", {
  image_path: t.string(),
});

export const ColorCorrectionFilter = filterType("color_filter_v2", {
  brightness: t.number(),
  color_add: t.number(),
  color_multiply: t.number(),
  contrast: t.number(),
  gamma: t.number(),
  hue_shift: t.number(),
  opacity: t.number(),
  saturation: t.number(),
});

export enum ChromaKeyColorType {
  Green = "green",
  Blue = "blue",
  Magenta = "magenta",
  Custom = "custom",
}

export const ChromaKeyFilter = filterType("chroma_key_filter_v2", {
  brightness: t.number(),
  contrast: t.number(),
  gamma: t.number(),
  key_color: t.number(),
  key_color_type: t.enum(ChromaKeyColorType),
  opacity: t.number(),
  similarity: t.number(),
  smoothness: t.number(),
  spill: t.number(),
});

export enum ColorKeyColorType {
  Green = "green",
  Blue = "blue",
  Red = "red",
  Magenta = "magenta",
  Custom = "custom",
}

export const ColorKeyFilter = filterType("color_key_filter_v2", {
  brightness: t.number(),
  contrast: t.number(),
  gamma: t.number(),
  key_color: t.number(),
  key_color_type: t.enum(ColorKeyColorType),
  opacity: t.number(),
  similarity: t.number(),
  smoothness: t.number(),
});

export const AspectRatioFilter = filterType("scale_filter", {
  resolution: t.string(),
  sampling: t.string(),
});

export const ApplyLutFilter = filterType("clut_filter", {
  image_path: t.string(),
});

export enum MaskBlendSelect {
  AlphaMaskAlphaChannel = "mask_alpha_filter.effect",
  AlphaMaskColourChannel = "mask_colour_filter.effect",
  BlendMultiply = "blend_mul_filter.effect",
  BlendAddition = "blend_add_filter.effect",
  BlendSubtraction = "blend_sub_filter.effect",
}

export const ImageMaskBlendFilter = filterType("mask_filter_v2", {
  image_path: t.string(),
  type: t.enum(MaskBlendSelect),
});

export const RenderDelayFilter = filterType("gpu_delay", {
  delay_ms: t.number(),
});

export const ScrollFilter = filterType("scroll_filter", {
  limit_cx: t.boolean(),
  limit_cy: t.boolean(),
  loop: t.boolean(),
  speed_x: t.number(),
  speed_y: t.number(),
});

export const SharpenFilter = filterType("sharpness_filter_v2", {
  sharpness: t.number(),
});

export const CompressorFilter = filterType("compressor_filter", {
  ratio: t.number(),
  threshold: t.number(),
  attack_time: t.number(),
  release_time: t.number(),
  output_gain: t.number(),
  sidechain_source: t.string(),
});

export enum ExpanderDetectorType {
  RMS = "RMS",
  Peak = "peak",
}

export enum ExpanderPreset {
  Expander = "expander",
  Gate = "gate",
}

export const ExpanderFilter = filterType("expander_filter", {
  ratio: t.number(),
  threshold: t.number(),
  attack_time: t.number(),
  release_time: t.number(),
  output_gain: t.number(),
  detector: t.enum(ExpanderDetectorType),
  presets: t.enum(ExpanderPreset),
});

export const GainFilter = filterType("gain_filter", {
  db: t.number(),
});

export const InvertPolarityFilter = filterType("gain_filter", {});

export const LimiterFilter = filterType("limiter_filter", {
  threshold: t.number(),
  release_time: t.number(),
});

export const NoiseGateFilter = filterType("noise_gate_filter", {
  open_threshold: t.number(),
  close_threshold: t.number(),
  attack_time: t.number(),
  hold_time: t.number(),
  release_time: t.number(),
});

export enum NoiseSuppressMethod {
  Speex = "speex",
  RNNoise = "rnnoise",
  NVAFX = "nvafx",
}

export const NoiseSuppressFilter = filterType("noise_suppress_filter", {
  method: t.enum(NoiseSuppressMethod),
});
