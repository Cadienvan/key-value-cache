import { arraify, isPromise } from "./lib";
import { CacheItem, TKey, TMapCache, TStrings } from "./types";

/**
 * I would probably add a Generic here like
 * export class KeyValueCache<T>
 *   #appCache: TMapCache<T> ... and so on
 *  
 *  export interface CacheItem<T> {
      value: any;
      ...
 *  
 *  export type TMapCache<T> = Map<string, CacheItem<T>>;
 */

export class KeyValueCache {
  #appCache: TMapCache;
  KEY_SEPARATOR = "|||";
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

  constructor(keySeparator = "|||") {
    this.#appCache = new Map();
    this.KEY_SEPARATOR = keySeparator;
  }

  #getMapKey(keys: TStrings) {
    return keys.join(this.KEY_SEPARATOR);
  }

  #reconstructMapKey(keys: string): TStrings {
    return keys.split(this.KEY_SEPARATOR);
  }

  exec(
    fn: () => Promise<any>,
    key: TKey,
    threshold = 1,
    dependencyKeys: TKey = [],
    ttl = this.DEFAULT_TTL
  ): Pick<CacheItem, "value"> | Promise<any> {
    const _keys = arraify(key);
    const _dependencyKeys = arraify(dependencyKeys);
    const cacheDataItem = this.get(_keys);

    if (cacheDataItem) {
      return isPromise(fn)
        ? cacheDataItem.value
        : new Promise((resolve) => {
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
      }
      // If fn isn't a promise, store the value and return it.
      this.set(_keys, value, threshold, _dependencyKeys, ttl);
      return value;
    }
  }

  set(
    key: TKey,
    value: any,
    threshold = 1,
    dependencyKeys: TStrings = [],
    ttl = this.DEFAULT_TTL
  ) {
    this.#appCache.set(this.#getMapKey(arraify(key)), {
      value,
      dependencyKeys,
      threshold,
      currentInvalidations: 0,
      ttl,
    });
  }

  isCached = (key: TKey) => {
    const _keys = arraify(key);
    return this.#appCache.get(this.#getMapKey(_keys));
  };

  get(key: TKey): Pick<CacheItem, "value"> | undefined {
    const _keys = arraify(key);
    const cacheDataItem = this.isCached(key);

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

  has(key: TKey) {
    return this.#appCache.has(this.#getMapKey(arraify(key)));
  }

  delete(key: TKey) {
    const _keys = arraify(key);
    return this.#appCache.delete(this.#getMapKey(_keys));
  }

  invalidate(key: string): void {
    let [cacheKey, cacheDataItem] = [key, this.isCached(key)];
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

  invalidateByKeys(keys: Array<string | RegExp>) {
    // Why a reduce? The invalidateByKeys is never used inside the class, why sum the invalidateByKey return
    // return keys.reduce((acc, key) => acc + this.invalidateByKey(key), 0);
    keys.forEach((key) => this.invalidateByKey(key));
  }

  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ) {
    const cacheDataItem = this.isCached(key);
    if (cacheDataItem) {
      cacheDataItem.dependencyKeys = dependencyKeys;
    }
  }

  clear() {
    this.#appCache.clear();
  }

  snapshot(resetCurrentInvalidations = false) {
    return JSON.stringify(
      Array.from(this.entries()).map(([k, v]) => [
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
