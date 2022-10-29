import { TKey, CacheItem, TStrings } from '.';

export interface SyncCacheStrategy {
  get(key: TKey): Pick<CacheItem, 'value'> | null;
  set(
    key: TKey,
    value: any,
    threshold?: number,
    dependencyKeys?: TStrings,
    ttl?: number
  ): void;
  cached(key: TKey): CacheItem | null;
  has(key: TKey): boolean;
  delete(key: TKey): boolean;
  invalidateByKey(key: string | RegExp): TStrings;
  invalidate(key: string): boolean;
  reconstructMapKey(key: string): TStrings;
  getMapKey(key: TStrings): string;
  setDependencyKeys(
    key: string | Array<string>,
    dependencyKeys: Array<string>
  ): void;
  clear(): void;
  snapshot(resetCurrentInvalidations?: boolean): string;
  restore(snapshotCache: string): void;
  size: number;
  entries: IterableIterator<[string, CacheItem]>;
  keys: IterableIterator<string>;
  values: IterableIterator<CacheItem>;
}
