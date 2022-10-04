export function removeUndefinedValues(obj: Record<string, any>) {
  return Object.entries(obj).reduce(
    (acc, [k, v]) => (v === undefined ? acc : { ...acc, [k]: v }),
    {}
  );
}

export function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function rgba(red: number, green: number, blue: number, alpha = 255) {
  return red + (green << 8) + (blue << 16) + (alpha << 24);
}
