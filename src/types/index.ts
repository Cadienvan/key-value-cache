export interface CacheItem {
  value: any;
  dependencyKeys: Array<string>;
  threshold: number;
  currentInvalidations: number;
  ttl: number;
}

export type TStrings = string[];
export type TKey = string | TStrings;
export type TMapCache = Map<string, CacheItem>;
