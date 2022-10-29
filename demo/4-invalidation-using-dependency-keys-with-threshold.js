const { KeyValueCache, Events } = require('@cadienvan/key-value-cache');
const cache = new KeyValueCache();

cache.set(
  'users',
  [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
    { id: 3, name: 'Jack' }
  ],
  3
);
cache.setDependencyKeys('users', ['user-1', 'user-2', 'user-3']);

cache.eventBus.on(Events.ON_INVALIDATED, (key) => {
  console.log('invalidated', key);
});

console.log('\n\n**********');
console.log(cache.get('users')); // This will print the users array containing all values

cache.invalidateByKey('user-1');
console.log('\n\n**********');
console.log(cache.get('users')); // This will print null as the dependency key "user-1" invalidated the "users" key
