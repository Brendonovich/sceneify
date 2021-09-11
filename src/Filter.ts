import { obs, Source } from ".";
import { DeepPartial } from "./types";

type Enum = {
  [ks: string]: string | number;
  [kn: number]: string;
};

type Type<T extends string, E extends object = {}> = {
  type: T;
} & E;

type NumberType = Type<"number">;
type StringType = Type<"string">;
type BoolType = Type<"bool">;
type EnumType<T extends Enum = {}> = Type<
  "enum",
  {
    enum: T;
  }
>;
type ObjectType<O extends Record<string, AnyType> = {}> = Type<
  "object",
  {
    object: O;
  }
>;

type PrimitiveType = NumberType | StringType | BoolType;

interface PrimitiveTypeMap extends Record<PrimitiveType["type"], any> {
  number: number;
  string: string;
  bool: boolean;
}

type AnyType = PrimitiveType | EnumType | ObjectType;

export const t = {
  number: (): NumberType => ({ type: "number" }),
  string: (): StringType => ({ type: "string" }),
  boolean: (): BoolType => ({ type: "bool" }),
  enum: <E extends Enum>(e: E): EnumType<E> => ({ type: "enum", enum: e }),
  object: <O extends Record<string, AnyType>>(o: O): ObjectType<O> => ({
    type: "object",
    object: o,
  }),
};

type ExtractTypes<T extends AnyType | Record<string, AnyType>> =
  T extends ObjectType<infer O>
    ? ExtractTypes<O>
    : T extends EnumType<infer E>
    ? E[keyof E]
    : T extends PrimitiveType
    ? PrimitiveTypeMap[T["type"]]
    : T extends Record<string, AnyType>
    ? {
        [K in keyof T]: ExtractTypes<T[K]>;
      }
    : never;

export interface SchemaArgs<Settings> {
  name: string;
  settings: Settings;
}

export abstract class FilterSchema<
  S extends Record<string, AnyType> = {},
  Settings = DeepPartial<ExtractTypes<S>>
> {
  abstract type: string;
  abstract settingsSchema: S;

  name: string;
  initialSettings: Settings;

  constructor({ name, settings }: SchemaArgs<Settings>) {
    this.name = name;
    this.initialSettings = settings;
  }
}

export class FilterInstance<
  S extends Record<string, AnyType>,
  Settings = DeepPartial<ExtractTypes<S>>
> {
  constructor(public schema: FilterSchema<S>) {}

  source?: Source;

  setSettings(settings: Settings) {
    if (!this.source) {
      console.warn(
        `Attempted to set settings on sourceless filter ${this.schema.name}`
      );
      return;
    }

    return obs.setSourceFilterSettings({
      source: this.source.name,
      filter: this.schema.name,
      settings: settings as any,
    });
  }

  setVisible(visible: boolean) {
    if (!this.source) {
      console.warn(
        `Attempted to set visibility on sourceless filter ${this.schema.name}`
      );
      return;
    }

    return obs.setSourceFilterVisibility({
      source: this.source.name,
      filter: this.schema.name,
      visible,
    });
  }
}

export const filterType = <S extends Record<string, AnyType>>(
  type: string,
  settingsSchema: S
) => {
  return class extends FilterSchema<S> {
    type = type;
    settingsSchema = settingsSchema;
  };
};
