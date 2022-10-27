import { KeyValueCache } from "../dist/index";
const cache = new KeyValueCache();

cache.onHit('a', () => {
    console.log('a hit');
});
cache.onMiss('a', () => {
    console.log('a miss');
});
cache.set('a', 1);
cache.get('a');
cache.get('a');