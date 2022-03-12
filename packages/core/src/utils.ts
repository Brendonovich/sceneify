export function removeUndefinedValues(obj: Record<string, any>) {
  return Object.entries(obj).reduce(
    (acc, [k, v]) => (v === undefined ? acc : { ...acc, [k]: v }),
    {}
  );
}
