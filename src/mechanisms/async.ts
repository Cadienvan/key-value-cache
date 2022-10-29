import { arraify, EventBus, EventCallback, isPromise } from '../lib';
import { AsyncBaseStrategy } from '../strategies';
import {
  CacheItem,
  TKey,
  TStrings,
  Events,
  AsyncCacheStrategy
} from '../types';

export class AsyncKeyValueCache {
  DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  eventBus: EventBus;
  cacheStrategy: AsyncCacheStrategy;

  constructor(strategy?: AsyncCacheStrategy) {
    if (strategy) {
      this.cacheStrategy = strategy;
    } else {
      this.cacheStrategy = new AsyncBaseStrategy();
    }
    this.eventBus = new EventBus();
  }

  async exec(
    fn: Function,
    key: TKey,
    threshold = 1,
    dependencyKeys: TKey = [],
    ttl = this.DEFAULT_TTL
  ): Promise<Pick<CacheItem, 'value'> | Promise<Pick<CacheItem, 'value'>>> {
    const _keys = arraify(key);
    const _dependencyKeys = arraify(dependencyKeys);
    const cacheDataItemValue = await this.get(_keys);

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
          value.then(async (v) => {
            await this.set(_keys, v, threshold, _dependencyKeys, ttl);
            resolve(v);
          });
        });
      }
      // If fn isn't a promise, store the value and return it.
      await this.set(_keys, value, threshold, _dependencyKeys, ttl);
      return value;
    }
  }

  async set(
    key: TKey,
    value: any,
    threshold = 1,
    dependencyKeys: TStrings = [],
    ttl = this.DEFAULT_TTL
  ) {
    const resp = await this.cacheStrategy.set(
      arraify(key),
      value,
      threshold,
      dependencyKeys,
      ttl
    );
    this.eventBus.emit(Events.ON_SET, key);
    return resp;
  }

  async get(key: TKey): Promise<Pick<CacheItem, 'value'> | null> {
    const cacheDataItem = await this.cacheStrategy.get(key);
    if (cacheDataItem) this.eventBus.emit(Events.ON_HIT, key);
    else this.eventBus.emit(Events.ON_MISS, key);
    return cacheDataItem;
  }

  async has(key: TKey) {
    return this.cacheStrategy.has(arraify(key));
  }

  async delete(key: TKey) {
    const _keys = arraify(key);
    const resp = await this.cacheStrategy.delete(_keys);
    this.eventBus.emit(Events.ON_DELETED, key);
    return resp;
  }

  async invalidateByKey(key: string | RegExp): Promise<TStrings> {
    const resp = await this.cacheStrategy.invalidateByKey(key);
    resp.forEach((k) => this.eventBus.emit(Events.ON_INVALIDATED, k));
    return resp;
  }

  async invalidateByKeys(keys: Array<string | RegExp>): Promise<number> {
    const invalidations = await Promise.all(
      keys.map((key) => this.invalidateByKey(key))
    );
    return invalidations.reduce(
      (acc, invalidation) => acc + invalidation.length,
      0
    );
  }

  async setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ) {
    return this.cacheStrategy.setDependencyKeys(key, dependencyKeys);
  }

  async clear() {
    await this.cacheStrategy.clear();
    this.eventBus.emit(Events.ON_CLEAR, {});
  }

  async snapshot(resetCurrentInvalidations = false) {
    return this.cacheStrategy.snapshot(resetCurrentInvalidations);
  }

  async restore(snapshotCache: string) {
    try {
      await this.cacheStrategy.restore(snapshotCache);
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

  size() {
    return this.cacheStrategy.size();
  }

  entries() {
    return this.cacheStrategy.entries();
  }

  keys() {
    return this.cacheStrategy.keys();
  }

  values() {
    return this.cacheStrategy.values();
  }
}
