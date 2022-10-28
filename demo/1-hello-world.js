import { KeyValueCache } from '../dist/index.js';
const cache = new KeyValueCache();

cache.set('key', 'value');
console.log(cache.entries);
console.log(cache.get('key')); // This will print "value"