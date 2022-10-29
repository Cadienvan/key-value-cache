const { KeyValueCache } = require('@cadienvan/key-value-cache');
const cache = new KeyValueCache();
const cacheItemKey = ['key1', 'key2', 'key3', 'key4'];
cache.set(cacheItemKey, 'value', 4); // This will store the value in the cache and set the threshold to 4
console.log('value: ', cache.get(cacheItemKey)); // This will return the value
cache.invalidateByKey('key1'); // This won't invalidate the item, but will increase the invalidation counter.
console.log('value: ', cache.get(cacheItemKey)); // This will return the value
cache.invalidateByKey('key2'); // This won't invalidate the item, but will increase the invalidation counter.
console.log('value: ', cache.get(cacheItemKey)); // This will return null
cache.invalidateByKeys(['key3', 'key4']); // This will invalidate the item
console.log('null: ', cache.get(cacheItemKey)); // This will return null
