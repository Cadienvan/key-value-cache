function isPromise(p: any): p is Promise<any> {
  return p && typeof p.then === "function";
}

export class KeyValueCache {
  #appCache: Map<string, any>;
  keySeparator = "|||";

  constructor(keySeparator = "|||") {
    this.#appCache = new Map();
    this.keySeparator = keySeparator;
  }

  #getMapKey(keys: Array<string>) {
    return keys.join(this.keySeparator);
  }

  #reconstructMapKey(keys: string) {
    return keys.split(this.keySeparator);
  }

  exec(fn: Function, keys: string | Array<string>): unknown {
    const _keys = Array.isArray(keys) ? keys : [keys];
    const cacheDataItem = this.#appCache.get(this.#getMapKey(_keys));
    if (cacheDataItem && !isPromise(cacheDataItem.value)) {
      // If fn isn't a promise and we already cached it, return it as it is
      return cacheDataItem.value;
    } else if (cacheDataItem && isPromise(cacheDataItem.value)) {
      // If fn is a promise and we already cached it, return it as a resolving promise
      return new Promise((resolve) => {
        resolve(cacheDataItem.value);
      });
    } else {
      // If we haven't cached it yet, cache it and return it
      const value = fn();
      if (isPromise(value)) {
        // If fn is a promise, thenify it, store the value and return it.
        value.then((value) => {
          this.#appCache.set(this.#getMapKey(_keys), value);
        });
        return value;
      } else {
        // If fn isn't a promise, store the value and return it.
        this.#appCache.set(this.#getMapKey(_keys), value);
        return value;
      }
    }
  }

  set(keys: string | Array<string>, value: any) {
    this.#appCache.set(
      this.#getMapKey(Array.isArray(keys) ? keys : [keys]),
      value
    );
  }

  get(keys: string | Array<string>) {
    const _keys = Array.isArray(keys) ? keys : [keys];
    const cacheDataItem = this.#appCache.get(this.#getMapKey(_keys));
    return cacheDataItem && cacheDataItem.value;
  }

  has(keys: string | Array<string>) {
    return this.#appCache.has(
      this.#getMapKey(Array.isArray(keys) ? keys : [keys])
    );
  }

  delete(keys: string | Array<string>) {
    const _keys = Array.isArray(keys) ? keys : [keys];
    return this.#appCache.delete(this.#getMapKey(_keys));
  }

  deleteByKey(key: string | RegExp): number {
    let count = 0;
    if (key instanceof RegExp) {
      for (const [k] of this.#appCache) {
        if (this.#reconstructMapKey(k).some((_k) => key.test(_k))) {
          this.#appCache.delete(k);
          count++;
        }
      }
    } else {
      for (const [k] of this.#appCache) {
        if (k.includes(key)) {
          this.#appCache.delete(k);
          count++;
        }
      }
    }
    return count;
  }

  deleteByKeys(keys: Array<string>): number {
    return keys.reduce((acc, key) => acc + this.deleteByKey(key), 0);
  }

  clear() {
    this.#appCache.clear();
  }

  get size() {
    return this.#appCache.size;
  }

  entries() {
    return this.#appCache.entries();
  }

  keys() {
    return this.#appCache.keys();
  }

  values() {
    return this.#appCache.values();
  }

  forEach(callback: (value: any, key: string, map: Map<string, any>) => void) {
    this.#appCache.forEach(callback);
  }

  [Symbol.iterator]() {
    return this.#appCache[Symbol.iterator]();
  }

  [Symbol.toStringTag]() {
    return this.#appCache[Symbol.toStringTag];
  }
}
