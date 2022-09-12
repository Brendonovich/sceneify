export function removeUndefinedValues(obj: Record<string, any>) {
  return Object.entries(obj).reduce(
    (acc, [k, v]) => (v === undefined ? acc : { ...acc, [k]: v }),
    {}
  );
}

export function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
