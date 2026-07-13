import * as Schema from "effect/Schema";
import {
  makeSettingsSchema,
  type SettingsFields,
  type SettingsFieldsType,
} from "./SettingsSchema.ts";

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
 * A class constructor that carries an OBS kind and settings schema.
 * This is what `InputType(kind)(fields)` returns.
 */
export interface InputType<Kind extends string = string, Settings = any>
  extends InputTypeBrand<Settings> {
  readonly kind: Kind;
  readonly schema: Schema.Schema<Settings, unknown, any>;
  new (_: never): {};
}

/**
 * Creates an InputType for a given OBS input kind.
 *
 * Usage:
 * ```ts
 * class BrowserSource extends InputType("browser_source")({
 *   url: Schema.String,
 *   width: Schema.Number,
 * }) {}
 *
 * BrowserSource.kind // "browser_source"
 * type Settings = InputTypeSettings<typeof BrowserSource>; // { url: string; width: number; }
 * ```
 */
export const InputType: <const Kind extends string>(
  kind: Kind
) => <Fields extends SettingsFields>(
  fields: Fields
) => InputType<Kind, SettingsFieldsType<Fields>> = (kind) => (fields) => {
  const schema = makeSettingsSchema(fields);
  const cls = class {
    static readonly kind = kind;
    static readonly schema = schema;
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
