const { KeyValueCache } = require('@cadienvan/key-value-cache');
const cache = new KeyValueCache();

cache.onHit('sleep', () => {
    console.log('sleep hit');
})

cache.onMiss('sleep', () => {
    console.log('sleep miss');
})

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
(async () => {
    console.log('ASYNC a');
    console.log(await cache.exec(async () => { await sleep(1000); return 1 }, 'sleep'))
    console.log('ASYNC b');
    console.log(await cache.exec(async () => { await sleep(1000); return 1 }, 'sleep'))
    console.log('ASYNC c');

    console.log('\n\n********\nNow Testing sync');
    console.log('SYNC a');
    console.log(cache.exec(() => { return 1 }, 'sleep'))
    console.log('SYNC b');
    console.log(cache.exec(() => { return 1 }, 'sleep'))
    console.log('SYNC c');

})();