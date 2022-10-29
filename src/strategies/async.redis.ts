import { arraify } from '../lib';
import { TKey, TStrings, AsyncCacheStrategy } from '../types';
import { createClient } from 'redis';

export type RedisClientType = ReturnType<typeof createClient>;

interface AsyncRedisStrategyOptions {
  keySeparator: string;
  keyPrefix: string;
}
export class AsyncRedisStrategy implements AsyncCacheStrategy {
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  appCache: RedisClientType;
  options: AsyncRedisStrategyOptions;

  constructor(
    redisClient: RedisClientType,
    options: AsyncRedisStrategyOptions = {
      keySeparator: '|||',
      keyPrefix: 'CACHE__'
    }
  ) {
    this.appCache = redisClient;
    this.options = options;
  }

  getMapKey(keys: TStrings) {
    return keys.join(this.options.keySeparator);
  }

  reconstructMapKey(keys: string): TStrings {
    return keys.split(this.options.keySeparator);
  }

  async set(
    key: TStrings,
    value: any,
    threshold = 1,
    dependencyKeys: TStrings = [],
    ttl = this.DEFAULT_TTL
  ) {
    this.appCache.set(
      `${this.options.keyPrefix}${this.getMapKey(key)}`,
      JSON.stringify({
        value,
        threshold,
        dependencyKeys,
        currentInvalidations: 0
      }),
      {
        PX: ttl
      }
    );
  }

  async cached(key: TKey) {
    const response =
      (await this.appCache.get(
        `${this.options.keyPrefix}${this.getMapKey(arraify(key))}`
      )) || null;
    console.log('response', response);
    return response ? JSON.parse(response) : null;
  }

  async get(key: TKey) {
    const cacheDataItem = await this.cached(key);
    return cacheDataItem?.value ?? null;
  }

  async has(key: TStrings) {
    return (await this.appCache.exists(this.getMapKey(key))) > 0;
  }

  async delete(key: TKey) {
    return (await this.appCache.del(this.getMapKey(arraify(key)))) > 0;
  }

  async invalidate(key: string) {
    let invalidated = false;
    const [cacheKey, cacheDataItem] = [key, await this.cached(arraify(key))];
    if (!cacheDataItem) return false;
    cacheDataItem.currentInvalidations++;
    invalidated = true;
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      await this.delete(cacheKey);
    } else {
      await this.set(
        arraify(cacheKey),
        cacheDataItem.value,
        cacheDataItem.threshold
      );
    }
    return invalidated;
  }
  async invalidateByKey(key: string | RegExp) {
    const invalidatedKeys: Array<string> = [];
    const cache = Array.from(await this.entries());
    console.log(cache);

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
    await this.appCache.flushAll();
  }

  async snapshot(resetCurrentInvalidations = false) {
    const cache = await this.entries();
    const snapshot = cache.map(([key, value]) => {
      if (resetCurrentInvalidations) {
        value.currentInvalidations = 0;
      }
      return [key, value];
    });
    return JSON.stringify(snapshot);
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
      await this.clear();
      for (const [key, value] of parsedSnapshot) {
        await this.set(this.reconstructMapKey(key), value);
      }
    } catch (e) {
      throw new Error('Invalid snapshot. Could not restore cache.');
    }
  }

  async size() {
    return (await this.keys()).length;
  }

  // @ts-ignore
  async entries() {
    const keys = await this.keys();
    console.log('keys', keys);
    const entries = await Promise.all(
      keys.map(async (key) => [key, await this.cached(key)])
    );
    return entries;
  }

  async keys() {
    return this.appCache.keys(`${this.options.keyPrefix}*`);
  }

  // @ts-ignore
  async values() {
    const keys = await this.keys();
    const values = await Promise.all(
      keys.map(async (key) => await this.cached(key))
    );
    return values;
  }
}
