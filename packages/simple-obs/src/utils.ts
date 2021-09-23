export function isObject(item?: Record<string, any>) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function mergeDeep(
  target: Record<string, any>,
  data: Record<string, any>,
  ignoreMissing: boolean = true
): any {
  if (isObject(target) && isObject(data)) {
    for (const key in data) {
      if (isObject(data[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], data[key], ignoreMissing);
      } else {
        if (!ignoreMissing || data[key] !== undefined)
          Object.assign(target, { [key]: data[key] });
      }
    }
  }

  return target;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
