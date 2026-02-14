import { defineFilterType } from "@sceneify/core";

export const compositeBlurFilter = defineFilterType(
  "obs_composite_blur"
).settings<{
  background: "None";
  blur_algorithm: number;
  blur_type: number;
  effect_mask_circle_center_x: number;
  effect_mask_circle_center_y: number;
  effect_mask_circle_radius: number;
  effect_mask_crop_bottom: number;
  effect_mask_crop_left: number;
  effect_mask_crop_right: number;
  effect_mask_crop_top: number;
  effect_mask_rect_center_x: number;
  effect_mask_rect_center_y: number;
  effect_mask_rect_height: number;
  effect_mask_rect_width: number;
  effect_mask_source_filter_multiplier: number;
  effect_mask_source_source: "None";
  kawase_passes: number;
  passes: number;
  pixelate_origin_x: number;
  pixelate_origin_y: number;
  radius: number;
}>();
