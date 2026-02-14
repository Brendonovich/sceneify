const InputTypeSettingsBrand = Symbol.for(
  "@sceneify/core-rewrite/InputTypeSettings"
);

/**
 * Phantom interface that carries the Settings type at the type level.
 */
export interface InputTypeBrand<Settings> {
  readonly [InputTypeSettingsBrand]: Settings;
}

/**
 * A generic class constructor that carries a Kind and Settings brand.
 * This is what InputType(kind) returns - a generic class that can be
 * extended with type arguments: `class X extends InputType("kind")<Settings>() {}`
 */
export interface InputType<Kind extends string = string, Settings = any>
  extends InputTypeBrand<Settings> {
  readonly kind: Kind;
  new (_: never): {};
}

/**
 * Creates an InputType for a given OBS input kind.
 *
 * Usage:
 * ```ts
 * class BrowserSource extends InputType("browser_source")<{
 *   url: string;
 *   width: number;
 * }> {}
 *
 * BrowserSource.kind // "browser_source"
 * type Settings = InputTypeSettings<typeof BrowserSource>; // { url: string; width: number; }
 * ```
 */
export const InputType: <const Kind extends string>(
  kind: Kind
) => <Settings>() => InputType<Kind, Settings> = (kind) => () => {
  const cls = class {
    static readonly kind = kind;
  };

  return cls as any;
};

/**
 * Extracts the Settings type from an InputType class.
 *
 * Usage:
 * ```ts
 * type Settings = InputTypeSettings<typeof BrowserSource>;
 * // => { url: string; width: number; }
 * ```
 */
export type InputTypeSettings<T> = T extends InputType<any, infer Settings>
  ? Settings
  : never;
