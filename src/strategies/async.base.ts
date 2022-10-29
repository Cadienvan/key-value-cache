import { arraify } from '../lib';
import { TKey, TMapCache, TStrings, AsyncCacheStrategy } from '../types';

export class AsyncBaseStrategy implements AsyncCacheStrategy {
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

  async set(
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

  async cached(key: TKey) {
    let response = this.appCache.get(this.getMapKey(arraify(key))) || null;
    if (response && response.ttl < Date.now()) {
      await this.delete(key);
      response = null;
    }
    return response;
  }

  async get(key: TKey) {
    const cacheDataItem = await this.cached(key);
    return cacheDataItem?.value ?? null;
  }

  async has(key: TStrings) {
    return this.appCache.has(this.getMapKey(key));
  }

  async delete(key: TKey) {
    return this.appCache.delete(this.getMapKey(arraify(key)));
  }

  async invalidate(key: string) {
    let invalidated = false;
    const [cacheKey, cacheDataItem] = [key, await this.cached(arraify(key))];
    if (!cacheDataItem) return false;
    cacheDataItem.currentInvalidations++;
    invalidated = true;
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      await this.delete(cacheKey);
    }
    return invalidated;
  }
  async invalidateByKey(key: string | RegExp) {
    const invalidatedKeys: Array<string> = [];
    const cache = Array.from(await this.entries());

    for (const [k, v] of cache) {
      if (key instanceof RegExp) {
        const check = this.reconstructMapKey(k).some((_k) => key.test(_k));
        const value = v.dependencyKeys.some((_k) => key.test(_k));
        if (check || value) {
          await this.invalidate(k);
          invalidatedKeys.push(k);
        }
      } else {
        const check = k.includes(key);
        const value = v.dependencyKeys.includes(key);
        if (check || value) {
          await this.invalidate(k);
          invalidatedKeys.push(k);
        }
      }
    }
    return invalidatedKeys;
  }

  async setDependencyKeys(key: TKey, dependencyKeys: TStrings) {
    const cacheDataItem = await this.cached(arraify(key));
    if (cacheDataItem) {
      cacheDataItem.dependencyKeys = dependencyKeys;
    }
  }

  async clear() {
    this.appCache.clear();
  }

  async snapshot(resetCurrentInvalidations = false) {
    return JSON.stringify(
      Array.from(await this.entries()).map(([k, v]) => [
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

  async restore(snapshotCache: string) {
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

  async size() {
    return this.appCache.size;
  }

  async entries() {
    return this.appCache.entries();
  }

  async keys() {
    return this.appCache.keys();
  }

  async values() {
    return this.appCache.values();
  }
}
