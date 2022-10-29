import { TKey, CacheItem, TStrings } from '.';

export interface AsyncCacheStrategy {
  get(key: TKey): Promise<Pick<CacheItem, 'value'> | null>;
  set(
    key: TKey,
    value: any,
    threshold?: number,
    dependencyKeys?: TStrings,
    ttl?: number
  ): Promise<void>;
  cached(key: TKey): Promise<CacheItem | null>;
  has(key: TKey): Promise<boolean>;
  delete(key: TKey): Promise<boolean>;
  invalidateByKey(key: string | RegExp): Promise<TStrings>;
  invalidate(key: string): Promise<boolean>;
  reconstructMapKey(key: string): TStrings;
  getMapKey(key: TStrings): string;
  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ): Promise<void>;
  clear(): Promise<void>;
  snapshot(resetCurrentInvalidations?: boolean): Promise<string>;
  restore(snapshotCache: string): Promise<void>;
  size(): Promise<number>;
  entries(): Promise<IterableIterator<[string, CacheItem]>>;
  keys(): Promise<IterableIterator<string> | string[]>;
  values(): Promise<IterableIterator<CacheItem>>;
}
