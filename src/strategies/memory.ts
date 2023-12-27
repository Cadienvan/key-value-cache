import { arraify } from '../lib';
import { CacheStrategy } from '../types/CacheStrategy';
import { TKey, TMapCache, TStrings } from '../types';

export class MemoryStrategy implements CacheStrategy {
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  appCache: TMapCache;
  KEY_SEPARATOR = '|||';

  constructor(keySeparator = '|||') {
    this.appCache = new Map();
    this.KEY_SEPARATOR = keySeparator;
  }

  getMapKey(keys: TStrings) {
    return keys.join(this.KEY_SEPARATOR);
  }

  reconstructMapKey(keys: string): TStrings {
    return keys.split(this.KEY_SEPARATOR);
  }

  set(
    key: TStrings,
    value: any,
    threshold = 1,
    dependencyKeys: TStrings = [],
    ttl = this.DEFAULT_TTL
  ) {
    this.appCache.set(this.getMapKey(key), {
      value,
      dependencyKeys,
      threshold,
      currentInvalidations: 0,
      ttl: Date.now() + ttl
    });
  }

  cached = (key: TKey) => {
    let response = this.appCache.get(this.getMapKey(arraify(key))) || null;
    if (response && response.ttl < Date.now()) {
      this.delete(key);
      response = null;
    }
    return response;
  };

  get = (key: TKey) => {
    const cacheDataItem = this.cached(key);
    return cacheDataItem?.value ?? null;
  };

  has(key: TStrings) {
    return this.appCache.has(this.getMapKey(key));
  }

  delete(key: TKey) {
    const resp = this.appCache.delete(this.getMapKey(arraify(key)));
    return resp;
  }

  invalidate(key: string): boolean {
    let invalidated = false;
    const [cacheKey, cacheDataItem] = [key, this.cached(arraify(key))];
    if (!cacheDataItem) return false;
    cacheDataItem.currentInvalidations++;
    invalidated = true;
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      this.appCache.delete(cacheKey);
    }
    return invalidated;
  }
  invalidateByKey(key: string | RegExp): TStrings {
    const invalidatedKeys: Array<string> = [];
    const cache = Array.from(this.entries);

    for (const [k, v] of cache) {
      if (key instanceof RegExp) {
        const check = this.reconstructMapKey(k).some((_k) => key.test(_k));
        const value = v.dependencyKeys.some((_k) => key.test(_k));
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

  setDependencyKeys(key: TKey, dependencyKeys: TStrings) {
    const cacheDataItem = this.cached(arraify(key));
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
          currentInvalidations: resetCurrentInvalidations
            ? 0
            : v.currentInvalidations
        }
      ])
    );
  }

  restore(snapshotCache: string) {
    // Check if the snapshot is valid
    try {
      JSON.parse(snapshotCache);
    } catch (e) {
      throw new Error('Invalid snapshot. Could not parse JSON result.');
    }

    // Check if the parsed snapshot is an array
    const parsedSnapshot = JSON.parse(snapshotCache);
    if (!Array.isArray(parsedSnapshot)) {
      throw new Error('Invalid snapshot. Snapshot must be an array.');
    }

    try {
      this.appCache = new Map(parsedSnapshot);
    } catch (e) {
      throw new Error('Invalid snapshot. Could not restore cache.');
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
