const { KeyValueCache } = require('../dist');
var kvCache = new KeyValueCache();

kvCache.set("users", ["user-1", "user-2", "user-3"]);
console.log("users", kvCache.get("users"));
const snap = kvCache.snapshot();
console.log("snap", snap);

var kvCache2 = new KeyValueCache();
kvCache2.restore(snap);
kvCache2.set("users", ["user-1", "user-2", "user-3", "user-4"]);
console.log("users kvCache", kvCache.get("users"));
console.log("users kvCache2", kvCache2.get("users"));
