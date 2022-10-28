import { arraify, isPromise } from "../lib/index.js";
import { CacheStrategy } from "../types/CacheStrategy.js";
import { CacheItem, TKey, TMapCache, TStrings } from "../types/index.js";

export class MemoryStrategy implements CacheStrategy {
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  appCache: TMapCache;
  KEY_SEPARATOR = "|||";

  constructor(keySeparator = "|||") {
    this.appCache = new Map();
    this.KEY_SEPARATOR = keySeparator;
  }

  getMapKey(keys: TStrings) {
    return keys.join(this.KEY_SEPARATOR);
  }

  reconstructMapKey(keys: string): TStrings {
    return keys.split(this.KEY_SEPARATOR);
  }

  exec(fn: Function, key: TKey, threshold = 1, dependencyKeys: TKey = [], ttl = this.DEFAULT_TTL): Pick<CacheItem, "value"> | Promise<Pick<CacheItem, "value">> {
    const _keys = arraify(key);
    const _dependencyKeys = arraify(dependencyKeys);
    const cacheDataItemValue = this.get(_keys);

    if (cacheDataItemValue) {
      return isPromise(fn)
        ? new Promise(resolve => {
            resolve(cacheDataItemValue);
          })
        : cacheDataItemValue;
    } else {
      // If we haven't cached it yet, cache it and return it
      const value = fn();
      if (isPromise(value)) {
        return new Promise(resolve => {
          value.then(v => {
            this.set(_keys, v, threshold, _dependencyKeys, ttl);
            resolve(v);
          });
        });
      }
      // If fn isn't a promise, store the value and return it.
      this.set(_keys, value, threshold, _dependencyKeys, ttl);
      return value;
    }
  }

  set(key: TStrings, value: any, threshold = 1, dependencyKeys: TStrings = [], ttl = this.DEFAULT_TTL) {
    this.appCache.set(this.getMapKey(key), {
      value,
      dependencyKeys,
      threshold,
      currentInvalidations: 0,
      ttl: Date.now() + ttl,
    });
  }

  cached = (key: TKey) => {
    const _keys = arraify(key);
    return this.appCache.get(this.getMapKey(_keys));
  };

  get = (key: TStrings) => {
    const cacheDataItem = this.cached(key);
    if (cacheDataItem) {
      if (cacheDataItem.ttl < Date.now()) {
        this.appCache.delete(this.getMapKey(key));
        return null;
      }
      return cacheDataItem.value;
    }
    return null;
  };

  has(key: TStrings) {
    return this.appCache.has(this.getMapKey(key));
  }

  delete(key: TStrings) {
    const resp = this.appCache.delete(this.getMapKey(key));
    return resp;
  }

  invalidate(key: string): void {
    let [cacheKey, cacheDataItem] = [key, this.cached(key)];
    if (!cacheDataItem) return;
    cacheDataItem.currentInvalidations++;
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      this.appCache.delete(cacheKey);
    }
  }
  invalidateByKey(key: string | RegExp): TStrings {
    let invalidatedKeys = [];
    const cache = Array.from(this.entries);

    for (const [k, v] of cache) {
      if (key instanceof RegExp) {
        const check = this.reconstructMapKey(k).some(_k => key.test(_k));
        const value = v.dependencyKeys.some(_k => key.test(_k));
        if (check || value) {
          this.invalidate(k);
          invalidatedKeys.push(k);
        }
      } else {
        const check = k.includes(key);
        const value = v.dependencyKeys.includes(key);
        if (check || value) {
          this.invalidate(k);
          invalidatedKeys.push(k);
        }
      }
    }
    return invalidatedKeys;
  }

  setDependencyKeys(key: string | Array<string>, dependencyKeys: Array<string>) {
    const cacheDataItem = this.cached(key);
    if (cacheDataItem) {
      cacheDataItem.dependencyKeys = dependencyKeys;
    }
  }

  clear() {
    this.appCache.clear();
  }

  snapshot(resetCurrentInvalidations = false) {
    return JSON.stringify(
      Array.from(this.entries).map(([k, v]) => [
        k,
        {
          ...v,
          currentInvalidations: resetCurrentInvalidations ? 0 : v.currentInvalidations,
        },
      ])
    );
  }

  restore(snapshotCache: string) {
    // Check if the snapshot is valid
    try {
      JSON.parse(snapshotCache);
    } catch (e) {
      throw new Error("Invalid snapshot. Could not parse JSON result.");
    }

    // Check if the parsed snapshot is an array
    const parsedSnapshot = JSON.parse(snapshotCache);
    if (!Array.isArray(parsedSnapshot)) {
      throw new Error("Invalid snapshot. Snapshot must be an array.");
    }

    try {
      this.appCache = new Map(parsedSnapshot);
    } catch (e) {
      throw new Error("Invalid snapshot. Could not restore cache.");
    }
  }

  get size() {
    return this.appCache.size;
  }

  get entries() {
    return this.appCache.entries();
  }

  get keys() {
    return this.appCache.keys();
  }

  get values() {
    return this.appCache.values();
  }
}
