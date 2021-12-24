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

export type DeepReplace<T, Replace> = T extends object
  ? {
      [K in keyof T]: DeepReplace<T[K], Replace>;
    }
  : Replace;

export type DeepPartialReplace<T, Replace> = T extends object
  ? {
      [K in keyof T]?: DeepReplace<T[K], Replace>;
    }
  : Replace;

export type DeepSearch<T, Search> = T extends object
  ? {
      [K in keyof T]: DeepSearch<T[K], Search>;
    }
  : T extends Search
  ? T
  : never;
