import { KeyValueCache } from "../dist/index.js";
var cache = new KeyValueCache();

cache.set(["users"], "USERS");
cache.set(["users", "users-payments", "users-orders"], "USERS+PAYMENTS+ORDERS");
cache.set(["users", "users-payments"], "USERS+PAYMENTS");
cache.set(
  ["users", "users-payments", "users-orders", "users-addresses"],
  "USERS+PAYMENTS+ORDERS+ADDRESSES"
);

console.log("\n\n**********");
console.log("Current entries:");
console.log(cache.entries());

console.log("\n\n**********");
console.log("Removing users-addresses");
cache.invalidateByKey("users-addresses");
console.log(cache.entries());

console.log("\n\n**********");
console.log("Removing everything but users");
cache.invalidateByKey(/users\-.+/);
console.log(cache.entries());
