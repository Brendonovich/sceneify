import * as Schema from "effect/Schema";

export interface SettingsField {
  readonly ast: unknown;
}

export type SettingsFields = {
  readonly [key: PropertyKey]: SettingsField;
};

type FieldType<Field> = Field extends { readonly Type: infer Type }
  ? Type
  : Field extends { readonly from: infer From }
  ? FieldType<From> | undefined
  : never;

type OptionalKeys<Fields extends SettingsFields> = {
  [Key in keyof Fields]: Fields[Key] extends { readonly _TypeToken: "?:" }
    ? Key
    : never;
}[keyof Fields];

export type SettingsFieldsType<Fields extends SettingsFields> = {
  readonly [Key in Exclude<keyof Fields, OptionalKeys<Fields>>]: FieldType<
    Fields[Key]
  >;
} & {
  readonly [Key in OptionalKeys<Fields>]?: FieldType<Fields[Key]>;
};

export const makeSettingsSchema = <Fields extends SettingsFields>(
  fields: Fields
): Schema.Schema<SettingsFieldsType<Fields>, unknown, any> =>
  Schema.Struct(fields as unknown as Schema.Struct.Fields) as Schema.Schema<
    SettingsFieldsType<Fields>,
    unknown,
    any
  >;
