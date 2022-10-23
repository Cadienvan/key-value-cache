import { arraify, isPromise } from "./lib/utils";
import { CacheItem } from "./models/CacheItem";




export class KeyValueCache {
  #appCache: Map<string, CacheItem>;
  KEY_SEPARATOR = "|||";
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

  constructor(keySeparator = "|||") {
    this.#appCache = new Map();
    this.KEY_SEPARATOR = keySeparator;
  }

  #getMapKey(keys: Array<string>) {
    return keys.join(this.KEY_SEPARATOR);
  }

  #reconstructMapKey(keys: string) {
    return keys.split(this.KEY_SEPARATOR);
  }

  exec(
    fn: Function,
    key: string | Array<string>,
    threshold = 1,
    dependencyKeys: string | Array<string> = [],
    ttl = this.DEFAULT_TTL
  ): unknown {
    const _keys = arraify(key);
    const _dependencyKeys = arraify(dependencyKeys);

    const cacheDataItem = this.get(_keys);
    if (cacheDataItem && !isPromise(fn)) {
      // If fn isn't a promise and we already cached it, return it as it is
      return cacheDataItem.value;
    } else if (cacheDataItem && isPromise(fn)) {
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
          this.set(_keys, value, threshold, _dependencyKeys, ttl);
        });
        return value;
      } else {
        // If fn isn't a promise, store the value and return it.
        this.set(_keys, value, threshold, _dependencyKeys, ttl);
        return value;
      }
    }
  }

  set(
    key: string | Array<string>,
    value: any,
    threshold = 1,
    dependencyKeys: Array<string> = [],
    ttl = this.DEFAULT_TTL
  ) {
    this.#appCache.set(this.#getMapKey(arraify(key)), {
      value,
      dependencyKeys,
      threshold,
      currentInvalidations: 0,
      ttl
    });
  }

  get(key: string | Array<string>) {
    const _keys = arraify(key)
    const cacheDataItem = this.#appCache.get(this.#getMapKey(_keys));
    // Check ttl
    if (cacheDataItem && cacheDataItem.ttl) {
      const now = Date.now();
      if (now - cacheDataItem.ttl > cacheDataItem.ttl) {
        this.#appCache.delete(this.#getMapKey(_keys));
        return undefined;
      }
    }
    return cacheDataItem && cacheDataItem.value;
  }

  has(key: string | Array<string>) {
    return this.#appCache.has(
      this.#getMapKey(arraify(key))
    );
  }

  delete(key: string | Array<string>) {
    const _keys = arraify(key);
    return this.#appCache.delete(this.#getMapKey(_keys));
  }

  invalidate(key: string): void {
    let [cacheKey, cacheDataItem] = [key, this.#appCache.get(key)];
    if (!cacheDataItem) return;
    cacheDataItem.currentInvalidations++;
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      this.#appCache.delete(cacheKey);
    }
  }

  invalidateByKey(key: string | RegExp): number {
    let count = 0;
    if (key instanceof RegExp) {
      for (const [k, v] of this.#appCache) {
        if (this.#reconstructMapKey(k).some((_k) => key.test(_k))) {
          this.invalidate(k);
          count++;
        }
        // Search for the key in the cache using the dependencyKeys array
        if (v.dependencyKeys.some((_k) => key.test(_k))) {
          this.invalidate(k);
          count++;
        }
      }
    } else {
      for (const [k, v] of this.#appCache) {
        if (k.includes(key)) {
          this.invalidate(k);
          count++;
        }
        // Search for the key in the cache using the dependencyKeys array
        if (v.dependencyKeys.includes(key)) {
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

  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ) {
    const _keys = arraify(key);
    const cacheDataItem = this.#appCache.get(this.#getMapKey(_keys));
    if (cacheDataItem) {
      cacheDataItem.dependencyKeys = dependencyKeys;
    }
  }

  clear() {
    this.#appCache.clear();
  }

  snapshot(resetCurrentInvalidations = false) {
    return JSON.stringify(
      Array.from(this.#appCache.entries()).map(([k, v]) => [
        k,
        {
          ...v,
          currentInvalidations: resetCurrentInvalidations
            ? 0
            : v.currentInvalidations,
        },
      ])
    );
  }

  restore(snapshotCache: string) {
    // Check if the snapshot is valid
    try {
      JSON.parse(snapshotCache);
    } catch (e) {
      throw new Error("Invalid snapshot");
    }

    // Check if the parsed snapshot is an array
    const parsedSnapshot = JSON.parse(snapshotCache);
    if (!Array.isArray(parsedSnapshot)) {
      throw new Error("Invalid snapshot");
    }

    try {
      this.#appCache = new Map(parsedSnapshot);
    } catch (e) {
      throw new Error("Invalid snapshot");
    }
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
