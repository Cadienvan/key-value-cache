import { TKey, CacheItem, TStrings } from "./index.js";

// Create an interface for the CacheStrategy class starting from the file memory.ts
export interface CacheStrategy {
  get(key: TKey): Pick<CacheItem, "value"> | null | undefined;
  set(key: TKey, value: any, threshold?: number, dependencyKeys?: TStrings, ttl?: number): void;
  cached(key: TKey): CacheItem | null | undefined;
  has(key: TKey): boolean;
  delete(key: TKey): void;
  invalidateByKey(key: string | RegExp): TStrings;
  invalidate(key: string): void;
  entries: IterableIterator<[string, CacheItem]>;
  reconstructMapKey(key: string): TStrings;
  getMapKey(key: TStrings): string;
  setDependencyKeys(key: string | Array<string>, dependencyKeys: Array<string>): void;
  clear(): void;
  snapshot(resetCurrentInvalidations?: boolean): String;
  restore(snapshotCache: string): void;
  size: number;
  keys: IterableIterator<string>;
  values: IterableIterator<CacheItem>;
}
