const { AsyncKeyValueCache } = require('../dist')
const cache = new AsyncKeyValueCache();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {

  await cache.set('key', 'value', 1, [], 1000);
  console.log(await cache.entries());
  console.log('now: ', Date.now());
  console.log(await cache.get('key'));
  await sleep(3000);
  console.log('now: ', Date.now());
  console.log(await cache.get('key'));
})();