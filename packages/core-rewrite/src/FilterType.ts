const FilterTypeSettingsBrand = Symbol.for(
  "@sceneify/core-rewrite/FilterTypeSettings"
);

/**
 * Phantom interface that carries the Settings type at the type level.
 */
export interface FilterTypeBrand<Settings> {
  readonly [FilterTypeSettingsBrand]: Settings;
}

/**
 * A generic class constructor that carries a Kind and Settings brand.
 * This is what FilterType(kind) returns - a generic class that can be
 * extended with type arguments: `class X extends FilterType("kind")<Settings>() {}`
 */
export interface FilterType<Kind extends string = string, Settings = any>
  extends FilterTypeBrand<Settings> {
  readonly kind: Kind;
  new (_: never): {};
}

/**
 * Creates a FilterType for a given OBS filter kind.
 *
 * Usage:
 * ```ts
 * class ColorCorrection extends FilterType("color_filter_v2")<{
 *   gamma: number;
 *   contrast: number;
 * }> {}
 *
 * ColorCorrection.kind // "color_filter_v2"
 * type Settings = FilterTypeSettings<typeof ColorCorrection>; // { gamma: number; contrast: number; }
 * ```
 */
export const FilterType: <const Kind extends string>(
  kind: Kind
) => <Settings>() => FilterType<Kind, Settings> = (kind) => () => {
  const cls = class {
    static readonly kind = kind;
  };

  return cls as any;
};

/**
 * Extracts the Settings type from a FilterType class.
 *
 * Usage:
 * ```ts
 * type Settings = FilterTypeSettings<typeof ColorCorrection>;
 * // => { gamma: number; contrast: number; }
 * ```
 */
export type FilterTypeSettings<T> = T extends {
  new (): FilterTypeBrand<infer Settings>;
}
  ? Settings
  : T extends FilterTypeBrand<infer Settings>
  ? Settings
  : never;
