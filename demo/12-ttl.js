const { SyncKeyValueCache } = require('../dist')
const cache = new SyncKeyValueCache();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {

  cache.set('key', 'value', 1, [], 1000);
  console.log(cache.entries);
  console.log('now: ', Date.now());
  console.log(cache.get('key'));
  await sleep(3000);
  console.log('now: ', Date.now());
  console.log(cache.get('key'));
})();