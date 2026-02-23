/**
 * Maps OBS input kinds to their @sceneify/sources class names.
 */
const INPUT_TYPE_MAP: Record<string, string> = {
  browser_source: "BrowserSource",
  color_source_v3: "ColorSource",
  image_source: "ImageSource",
  text_ft2_source_v2: "FreetypeTextSource",
  text_gdiplus_v2: "GdiPlusTextSource",
  ffmpeg_source: "MediaSource",
  monitor_capture: "DisplayCaptureSource",
  av_capture_input_v2: "VideoCaptureSource",
  "decklink-input": "DecklinkInput",
  coreaudio_input_capture: "CoreAudioInputCapture",
  screen_capture: "MacOSScreenCapture",
};

/**
 * Maps OBS filter kinds to their @sceneify/sources class names.
 */
const FILTER_TYPE_MAP: Record<string, string> = {
  clut_filter: "ApplyLUTFilter",
  scale_filter: "AspectRatioFilter",
  chroma_key_filter_v2: "ChromaKeyFilter",
  color_filter_v2: "ColorCorrectionFilter",
  color_key_filter_v2: "ColorKeyFilter",
  compressor_filter: "CompressorFilter",
  crop_filter: "CropPadFilter",
  expander_filter: "ExpanderFilter",
  gain_filter: "GainFilter",
  mask_filter_v2: "ImageMaskBlendFilter",
  invert_polarity_filter: "InvertPolarityFilter",
  limiter_filter: "LimiterFilter",
  luma_key_filter: "LumaKeyFilter",
  noise_gate_filter: "NoiseGateFilter",
  noise_suppress_filter_v2: "NoiseSuppressFilter",
  gpu_delay: "RenderDelayFilter",
  scroll_filter: "ScrollFilter",
  sharpness_filter_v2: "SharpenFilter",
};

/**
 * Registry for mapping OBS kinds to @sceneify/sources types.
 */
export class TypeRegistry {
  private inputTypes: Map<string, string>;
  private filterTypes: Map<string, string>;
  private usedInputTypes: Set<string> = new Set();
  private usedFilterTypes: Set<string> = new Set();

  constructor() {
    this.inputTypes = new Map(Object.entries(INPUT_TYPE_MAP));
    this.filterTypes = new Map(Object.entries(FILTER_TYPE_MAP));
  }

  /**
   * Look up the TypeScript class name for an OBS input kind.
   * Returns undefined if the kind is not known.
   */
  getInputTypeName(kind: string): string | undefined {
    return this.inputTypes.get(kind);
  }

  /**
   * Look up the TypeScript class name for an OBS filter kind.
   * Returns undefined if the kind is not known.
   */
  getFilterTypeName(kind: string): string | undefined {
    return this.filterTypes.get(kind);
  }

  /**
   * Mark an input type as used in the generated code.
   */
  markInputTypeUsed(kind: string): void {
    const typeName = this.getInputTypeName(kind);
    if (typeName) {
      this.usedInputTypes.add(typeName);
    }
  }

  /**
   * Mark a filter type as used in the generated code.
   */
  markFilterTypeUsed(kind: string): void {
    const typeName = this.getFilterTypeName(kind);
    if (typeName) {
      this.usedFilterTypes.add(typeName);
    }
  }

  /**
   * Get all input types that have been marked as used.
   */
  getUsedInputTypes(): string[] {
    return Array.from(this.usedInputTypes).sort();
  }

  /**
   * Get all filter types that have been marked as used.
   */
  getUsedFilterTypes(): string[] {
    return Array.from(this.usedFilterTypes).sort();
  }

  /**
   * Check if an input kind is known.
   */
  isKnownInputKind(kind: string): boolean {
    return this.inputTypes.has(kind);
  }

  /**
   * Check if a filter kind is known.
   */
  isKnownFilterKind(kind: string): boolean {
    return this.filterTypes.has(kind);
  }

  /**
   * Get all known input kinds.
   */
  getKnownInputKinds(): string[] {
    return Array.from(this.inputTypes.keys());
  }

  /**
   * Get all known filter kinds.
   */
  getKnownFilterKinds(): string[] {
    return Array.from(this.filterTypes.keys());
  }
}

/**
 * Error thrown when an unknown input or filter kind is encountered.
 */
export class UnknownKindError extends Error {
  constructor(
    public readonly kindType: "input" | "filter",
    public readonly kind: string
  ) {
    const message = 
      `Unknown ${kindType} kind "${kind}". ` +
      `Add it to @sceneify/sources/src/${kindType === "input" ? "Inputs" : "Filters"}.ts ` +
      `or handle it in the generator.`;
    super(message);
    this.name = "UnknownKindError";
  }
}
