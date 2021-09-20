export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type FieldPartial<T extends object> =
  | {
      [K in keyof FilterType<T, object>]: FieldPartial<T[K]>;
    }
  | {
      [P in keyof Omit<T, keyof FilterType<T, object>>]?: T[P];
    };

export type FilterType<Base, Condition> = Pick<
  Base,
  {
    [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
  }[keyof Base]
>;
