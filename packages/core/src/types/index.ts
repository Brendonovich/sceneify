import { Source } from "../Source";

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type FilterType<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
  }[keyof Base]
>;

export type SourceItemType<S extends Source> = ReturnType<
  S["createItemInstance"]
>;

export * from "./obs-websocket-js";
