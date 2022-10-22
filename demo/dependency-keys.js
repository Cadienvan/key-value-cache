import { KeyValueCache } from "../dist/index.js";
var kvCache = new KeyValueCache();

kvCache.set(
  "users",
  [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
    { id: 3, name: "Jack" },
  ],
  2
);
kvCache.setDependencyKeys("users", ["user-1", "user-2", "user-3"]);

console.log("\n\n**********");
console.log(kvCache.entries());

kvCache.invalidate("user-1");
console.log("\n\n**********");
console.log(kvCache.entries());

kvCache.invalidate("user-2");
console.log("\n\n**********");
console.log(kvCache.entries());
