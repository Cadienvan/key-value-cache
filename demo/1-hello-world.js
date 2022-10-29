const { SyncKeyValueCache } = require('../dist')
const cache = new SyncKeyValueCache();

cache.set('key', 'value');
console.log(cache.entries);
console.log(cache.get('key')); // This will print "value"
