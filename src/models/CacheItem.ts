export interface CacheItem {
    value: any;
    dependencyKeys: Array<string>;
    threshold: number;
    currentInvalidations: number;
    ttl: number;
  }