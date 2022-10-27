import { KeyValueCache } from "../dist/index.js";
var kvCache = new KeyValueCache();

const asyncLongRunningOperation = async (timeInMs = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeInMs);
  });
};

(async() => {
let perfTime = performance.now();
await asyncLongRunningOperation();
await asyncLongRunningOperation();
await asyncLongRunningOperation();
console.log("Pre-cache: ", performance.now() - perfTime);
perfTime = performance.now();
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
console.log("Post-cache: ", performance.now() - perfTime);
perfTime = performance.now();
kvCache.delete(["asyncLongRunningOperation"]);
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
kvCache.delete(["asyncLongRunningOperation"]);
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
await kvCache.exec(() => {
  return asyncLongRunningOperation();
}, ["asyncLongRunningOperation"]);
console.log(
  "Post-cache with double invalidation: ",
  performance.now() - perfTime
);
})();