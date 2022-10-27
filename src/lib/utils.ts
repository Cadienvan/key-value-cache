export function arraify(value: any) {
  return Array.isArray(value) ? value : [value];
}

export function isPromise(p: any): p is Promise<any> {
  return p && typeof p.then === "function";
}
