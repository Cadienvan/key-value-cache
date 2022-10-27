import { KeyValueCache } from "../dist/index.js";
const cache = new KeyValueCache();

cache.set(
  "users",
  [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
    { id: 3, name: "Jack" },
  ],
  2
);
cache.setDependencyKeys("users", ["user-1", "user-2", "user-3"]);

console.log("\n\n**********");
console.log(cache.get('users')); // This will print the users array containing all values

cache.invalidateByKey("user-1");
console.log("\n\n**********");
console.log(cache.get('users')); // This will return 