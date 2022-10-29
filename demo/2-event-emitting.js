const { SyncKeyValueCache, Events } = require('../dist')
const cache = new SyncKeyValueCache();

cache.onHit('a', () => {
  console.log('a hit');
});

cache.onMiss('a', () => {
  console.log('a miss');
});

cache.eventBus.on(Events.ON_INVALIDATED, (key) => {
  console.log('invalidated', key);
});

cache.set('a', 1);
cache.get('a');
cache.get('a');
cache.invalidateByKey('a');
