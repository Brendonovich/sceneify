export function getDeep(obj: any, path: string[]): any | undefined {
  for (let i = 0, len = path.length; i < len; i++) {
    obj = obj?.[path[i]];
  }
  return obj;
}
