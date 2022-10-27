import { arraify, EventBus, isPromise } from "./lib";
import { EventCallback } from "./lib/eventBus";
import { CacheItem, TKey, TMapCache, TStrings } from "./types";

/**
 * @todo
 * Pass a generic to class
 *
 * @example
 * export class KeyValueCache<T>
 * appCache: TMapCache<T> ... and so on
 * export type TMapCache<T> = Map<string, CacheItem<T>>;
 */

export enum Events {
  ON_SET = "onSet",
  ON_HIT = "onHit",
  ON_MISS = "onMiss",
  ON_TTL_EXPIRED = "onTtlExpired",
  ON_INVALIDATED = "onInvalidated",
  ON_DELETED = "onDeleted",
  ON_CLEAR = "onClear",
  ON_SNAPSHOT_RESTORED = "onSnapshotRestored",
}

export class KeyValueCache {
  appCache: TMapCache;
  KEY_SEPARATOR = "|||";
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  eventBus: EventBus;

  constructor(keySeparator = "|||") {
    this.appCache = new Map();
    this.KEY_SEPARATOR = keySeparator;
    this.eventBus = new EventBus();
  }

  getMapKey(keys: TStrings) {
    return keys.join(this.KEY_SEPARATOR);
  }

  reconstructMapKey(keys: string): TStrings {
    return keys.split(this.KEY_SEPARATOR);
  }

  exec(
    fn: Function,
    key: TKey,
    threshold = 1,
    dependencyKeys: TKey = [],
    ttl = this.DEFAULT_TTL
  ): Pick<CacheItem, "value"> | Promise<Pick<CacheItem, "value">> {
    const _keys = arraify(key);
    const _dependencyKeys = arraify(dependencyKeys);
    const cacheDataItemValue = this.get(_keys);

    if (cacheDataItemValue) {
      return isPromise(fn)
        ? new Promise((resolve) => {
            resolve(cacheDataItemValue);
          })
        : cacheDataItemValue;
    } else {
      // If we haven't cached it yet, cache it and return it
      const value = fn();
      if (isPromise(value)) {
        return new Promise((resolve) => {
          value.then((v) => {
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

  set(
    key: TKey,
    value: any,
    threshold = 1,
    dependencyKeys: TStrings = [],
    ttl = this.DEFAULT_TTL
  ) {
    this.appCache.set(this.getMapKey(arraify(key)), {
      value,
      dependencyKeys,
      threshold,
      currentInvalidations: 0,
      ttl: Date.now() + ttl,
    });
    this.eventBus.emit(Events.ON_SET, key);
  }

  cached = (key: TKey) => {
    const _keys = arraify(key);
    return this.appCache.get(this.getMapKey(_keys));
  };

  get(key: TKey): Pick<CacheItem, "value"> | undefined {
    const _keys = arraify(key);
    const cacheDataItem = this.cached(key);
    if (cacheDataItem) this.eventBus.emit(Events.ON_HIT, key);
    else this.eventBus.emit(Events.ON_MISS, key);

    // Check ttl
    if (cacheDataItem && cacheDataItem.ttl) {
      const now = Date.now();
      if (now - cacheDataItem.ttl > 0) {
        this.appCache.delete(this.getMapKey(_keys));
        this.eventBus.emit(Events.ON_TTL_EXPIRED, key);
        return undefined;
      }
    }
    return cacheDataItem && cacheDataItem.value;
  }

  has(key: TKey) {
    return this.appCache.has(this.getMapKey(arraify(key)));
  }

  delete(key: TKey) {
    const _keys = arraify(key);
    const resp = this.appCache.delete(this.getMapKey(_keys));
    this.eventBus.emit(Events.ON_DELETED, key);
    return resp;
  }

  invalidate(key: string): void {
    let [cacheKey, cacheDataItem] = [key, this.cached(key)];
    if (!cacheDataItem) return;
    cacheDataItem.currentInvalidations++;
    this.eventBus.emit(Events.ON_INVALIDATED, key);
    if (cacheDataItem.currentInvalidations >= cacheDataItem.threshold) {
      this.appCache.delete(cacheKey);
    }
  }

  invalidateByKey(key: string | RegExp): number {
    let count = 0;
    if (key instanceof RegExp) {
      for (const [k, v] of Array.from(this.appCache)) {
        if (this.reconstructMapKey(k).some((_k) => key.test(_k))) {
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
      for (const [k, v] of Array.from(this.appCache)) {
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
    return keys.reduce((acc, key) => acc + this.invalidateByKey(key), 0);
  }

  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ) {
    const cacheDataItem = this.cached(key);
    if (cacheDataItem) {
      cacheDataItem.dependencyKeys = dependencyKeys;
    }
  }

  clear() {
    this.eventBus.emit(Events.ON_CLEAR, {});
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
      this.appCache = new Map(parsedSnapshot);
      this.eventBus.emit(Events.ON_SNAPSHOT_RESTORED, {});
    } catch (e) {
      throw new Error("Invalid snapshot");
    }
  }

  onHit(key: TKey, fn: EventCallback) {
    return this.eventBus.on(Events.ON_HIT, (eventData) => {
      if (eventData === key) fn(eventData);
    });
  }

  onMiss(key: TKey, fn: EventCallback) {
    return this.eventBus.on(Events.ON_MISS, (eventData) => {
      if (eventData === key) fn(eventData);
    });
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

  forEach(callback: (value: any, key: string, map: Map<string, any>) => void) {
    this.appCache.forEach(callback);
  }

  [Symbol.iterator]() {
    return this.appCache[Symbol.iterator]();
  }

  [Symbol.toStringTag]() {
    return this.appCache[Symbol.toStringTag];
  }
}
