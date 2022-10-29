const { KeyValueCache } = require('@cadienvan/key-value-cache');
const cache = new KeyValueCache();

cache.set('key', 'value');
console.log(cache.entries);
console.log(cache.get('key')); // This will print "value"
