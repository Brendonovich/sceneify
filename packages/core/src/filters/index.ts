import { Filter } from "../Filter";

export class CropPadFilter extends Filter<{
  bottom: number;
  left: number;
  relative: boolean;
  right: number;
  rop: number;
}> {
  type = "crop_filter";
}

export class LumaKeyFilter extends Filter<{
  luma_max: number;
  luma_max_smooth: number;
  luma_min: number;
  luma_min_smooth: number;
}> {
  type = "luma_key_filter_v2";
}

export class ApplyLUTFilter extends Filter<{
  image_path: string;
}> {
  type = "clut_filter";
}

export class ColorCorrectionFilter extends Filter<{
  brightness: number;
  color_add: number;
  color_multiply: number;
  contrast: number;
  gamma: number;
  hue_shift: number;
  opacity: number;
  saturation: number;
}> {
  type = "color_filter_v2";
}

export enum ChromaKeyColorType {
  Green = "green",
  Blue = "blue",
  Magenta = "magenta",
  Custom = "custom",
}

export class ChromaKeyFilter extends Filter<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: ChromaKeyColorType;
  opacity: number;
  similarity: number;
  smoothness: number;
  spill: number;
}> {
  type = "chroma_key_filter_v2";
}

export enum ColorKeyColorType {
  Green = "green",
  Blue = "blue",
  Red = "red",
  Magenta = "magenta",
  Custom = "custom",
}

export class ColorKeyFilter extends Filter<{
  brightness: number;
  contrast: number;
  gamma: number;
  key_color: number;
  key_color_type: ColorKeyColorType;
  opacity: number;
  similarity: number;
  smoothness: number;
}> {
  type = "color_key_filter_v2";
}

export class AspectRatioFilter extends Filter<{
  resolution: string;
  sampling: string;
}> {
  type = "scale_filter";
}

export class ApplyLutFilter extends Filter<{
  image_path: string;
}> {
  type = "clut_filter";
}

export enum MaskBlendSelect {
  AlphaMaskAlphaChannel = "mask_alpha_filter.effect",
  AlphaMaskColourChannel = "mask_colour_filter.effect",
  BlendMultiply = "blend_mul_filter.effect",
  BlendAddition = "blend_add_filter.effect",
  BlendSubtraction = "blend_sub_filter.effect",
}

export class ImageMaskBlendFilter extends Filter<{
  image_path: string;
  type: MaskBlendSelect;
}> {
  type = "mask_filter_v2";
}

export class RenderDelayFilter extends Filter<{
  delay_ms: number;
}> {
  type = "gpu_delay";
}

export class ScrollFilter extends Filter<{
  limit_cx: boolean;
  limit_cy: boolean;
  loop: boolean;
  speed_x: number;
  speed_y: number;
}> {
  type = "scroll_filter";
}

export class SharpenFilter extends Filter<{
  sharpness: number;
}> {
  type = "sharpness_filter_v2";
}

export class CompressorFilter extends Filter<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  sidechain_source: string;
}> {
  type = "compressor_filter";
}

export enum ExpanderDetectorType {
  RMS = "RMS",
  Peak = "peak",
}

export enum ExpanderPreset {
  Expander = "expander",
  Gate = "gate",
}

export class ExpanderFilter extends Filter<{
  ratio: number;
  threshold: number;
  attack_time: number;
  release_time: number;
  output_gain: number;
  detector: ExpanderDetectorType;
  presets: ExpanderPreset;
}> {
  type = "expander_filter";
}

export class GainFilter extends Filter<{ db: number }> {
  type = "gain_filter";
}

export class InvertPolarityFilter extends Filter<{}> {
  type = "gain_filter";
}

export class LimiterFilter extends Filter<{
  threshold: number;
  release_time: number;
}> {
  type = "limiter_filter";
}

export class NoiseGateFilter extends Filter<{
  open_threshold: number;
  close_threshold: number;
  attack_time: number;
  hold_time: number;
  release_time: number;
}> {
  type = "noise_gate_filter";
}

export enum NoiseSuppressMethod {
  Speex = "speex",
  RNNoise = "rnnoise",
  NVAFX = "nvafx",
}

export class NoiseSuppressFilter extends Filter<{
  method: NoiseSuppressMethod;
}> {
  type = "noise_suppress_filter";
}
