function isPromise(p: any): p is Promise<any> {
  return p && typeof p.then === "function";
}

interface CacheItem {
  value: any;
  threshold: number;
  currentInvalidations: number;
}

export class KeyValueCache {
  #appCache: Map<string, CacheItem>;
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

  exec(fn: Function, keys: string | Array<string>, threshold = 1): unknown {
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
          this.#appCache.set(this.#getMapKey(_keys), {
            value,
            threshold,
            currentInvalidations: 0,
          });
        });
        return value;
      } else {
        // If fn isn't a promise, store the value and return it.
        this.#appCache.set(this.#getMapKey(_keys), {
          value,
          threshold,
          currentInvalidations: 0,
        });
        return value;
      }
    }
  }

  set(keys: string | Array<string>, value: any, threshold = 1) {
    this.#appCache.set(this.#getMapKey(Array.isArray(keys) ? keys : [keys]), {
      value,
      threshold,
      currentInvalidations: 0,
    });
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

  invalidate(key: string): any {
    const cacheDataItem = this.#appCache.get(key);
    if (cacheDataItem) {
      cacheDataItem.currentInvalidations++;
      if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
        this.#appCache.delete(key);
      }
    }
  }

  invalidateByKey(key: string | RegExp): number {
    let count = 0;
    if (key instanceof RegExp) {
      for (const [k] of this.#appCache) {
        if (this.#reconstructMapKey(k).some((_k) => key.test(_k))) {
          this.invalidate(k);
          count++;
        }
      }
    } else {
      for (const [k] of this.#appCache) {
        if (k.includes(key)) {
          this.invalidate(k);
          count++;
        }
      }
    }
    return count;
  }

  invalidateByKeys(keys: Array<string | RegExp>): number {
    return keys.reduce((acc, key) => acc + this.invalidateByKey(key), 0);
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
