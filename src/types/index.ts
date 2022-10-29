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

export enum Events {
  ON_SET = 'onSet',
  ON_HIT = 'onHit',
  ON_MISS = 'onMiss',
  ON_TTL_EXPIRED = 'onTtlExpired',
  ON_INVALIDATED = 'onInvalidated',
  ON_DELETED = 'onDeleted',
  ON_CLEAR = 'onClear',
  ON_SNAPSHOT_RESTORED = 'onSnapshotRestored',
  ON_SNAPSHOT_RESTORE_FAILED = 'onSnapshotRestoreFailed'
}

export { AsyncCacheStrategy } from './AsyncCacheStrategy';
export { SyncCacheStrategy } from './SyncCacheStrategy';
