import { defineFilterType } from "@sceneify/core";

export const blurFilter = defineFilterType("streamfx-filter-blur").settings<{
  "Filter.Blur.Type": string;
  "Filter.Blur.Subtype": "area";
  "Filter.Blur.Size": number;
}>();
