import { KeyValueCache } from "../dist/index.js";
const cache = new KeyValueCache();

const longRunningOperation = (iterations = 500000000) => {
  for (let i = 0; i < iterations; i++) {}
  return true;
};

cache.set('user-1', { id: 1, name: "John" });
cache.set('user-2', { id: 2, name: "Jane" });
cache.set('user-3', { id: 3, name: "Jack" });
console.log(cache.entries()); // This will output all 3 entries
cache.invalidateByKey(/user.+/); // This will invalidate all entries with keys that match the regex

console.log(cache.entries()); // This will output an empty map as all entries were invalidated