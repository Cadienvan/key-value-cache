const { KeyValueCache } = require('../dist/cjs/index');
const cache = new KeyValueCache();

cache.set(
  "users",
  [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" },
    { id: 3, name: "Jack" },
  ]
);
cache.setDependencyKeys("users", ["user-1", "user-2", "user-3"]);

console.log("\n\n**********");
console.log(cache.get('users')); // This will print the users array

cache.invalidateByKey("user-1");
console.log("\n\n**********");
console.log(cache.get('users')); // This will print undefined as the dependency key "user-1" invalidated the "users" key