import { KeyValueCache } from "../dist/index.js";
var cache = new KeyValueCache();

cache.set(["users"], "USERS");
cache.set(["users", "users-payments", "users-orders"], "USERS+PAYMENTS+ORDERS");
cache.set(["users", "users-payments"], "USERS+PAYMENTS");
cache.set(
  ["users", "users-payments", "users-orders", "users-addresses"],
  "USERS+PAYMENTS+ORDERS+ADDRESSES"
);

console.log(cache.entries());
console.log("Removing users-addresses");
cache.deleteByKey("users-addresses");

console.log(cache.entries());
console.log("Removing everything but users");
cache.deleteByKey(/users\-.+/);

console.log(cache.entries());
