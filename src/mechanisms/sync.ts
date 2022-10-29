import { arraify, EventBus, EventCallback, isPromise } from '../lib';
import { SyncMemoryStrategy } from '../strategies';
import { CacheItem, TKey, TStrings, Events, SyncCacheStrategy } from '../types';

/**
 * @todo
 * Pass a generic to class
 *
 * @example
 * export class KeyValueCache<T>
 * appCache: TMapCache<T> ... and so on
 * export type TMapCache<T> = Map<string, CacheItem<T>>;
 */

export class SyncKeyValueCache {
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  eventBus: EventBus;
  cacheStrategy: SyncCacheStrategy;

  constructor(strategy?: SyncCacheStrategy, keySeparator = '|||') {
    if (strategy) {
      this.cacheStrategy = strategy;
    } else {
      this.cacheStrategy = new SyncMemoryStrategy(keySeparator);
    }
    this.eventBus = new EventBus();
  }

  exec(
    fn: Function,
    key: TKey,
    threshold = 1,
    dependencyKeys: TKey = [],
    ttl = this.DEFAULT_TTL
  ): Pick<CacheItem, 'value'> | Promise<Pick<CacheItem, 'value'>> {
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
    const resp = this.cacheStrategy.set(
      arraify(key),
      value,
      threshold,
      dependencyKeys,
      ttl
    );
    this.eventBus.emit(Events.ON_SET, key);
    return resp;
  }

  get(key: TKey): Pick<CacheItem, 'value'> | null {
    const cacheDataItem = this.cacheStrategy.get(key);
    if (cacheDataItem) this.eventBus.emit(Events.ON_HIT, key);
    else this.eventBus.emit(Events.ON_MISS, key);
    return cacheDataItem;
  }

  has(key: TKey) {
    return this.cacheStrategy.has(arraify(key));
  }

  delete(key: TKey) {
    const _keys = arraify(key);
    const resp = this.cacheStrategy.delete(_keys);
    this.eventBus.emit(Events.ON_DELETED, key);
    return resp;
  }

  invalidateByKey(key: string | RegExp): TStrings {
    const resp = this.cacheStrategy.invalidateByKey(key);
    resp.forEach((k) => this.eventBus.emit(Events.ON_INVALIDATED, k));
    return resp;
  }

  invalidateByKeys(keys: Array<string | RegExp>): number {
    return keys.reduce((acc, key) => acc + this.invalidateByKey(key).length, 0);
  }

  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ) {
    return this.cacheStrategy.setDependencyKeys(key, dependencyKeys);
  }

  clear() {
    this.cacheStrategy.clear();
    this.eventBus.emit(Events.ON_CLEAR, {});
  }

  snapshot(resetCurrentInvalidations = false) {
    return this.cacheStrategy.snapshot(resetCurrentInvalidations);
  }

  restore(snapshotCache: string) {
    try {
      this.cacheStrategy.restore(snapshotCache);
      this.eventBus.emit(Events.ON_SNAPSHOT_RESTORED, {});
    } catch (e: unknown) {
      this.eventBus.emit(Events.ON_SNAPSHOT_RESTORE_FAILED, e);
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
    return this.cacheStrategy.size;
  }

  get entries() {
    return this.cacheStrategy.entries;
  }

  get keys() {
    return this.cacheStrategy.keys;
  }

  get values() {
    return this.cacheStrategy.values;
  }
}
