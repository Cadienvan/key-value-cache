# What is this?

An in-memory key-value cache for function execution.  
For every function, you can define a key or a set of keys and an additional array of dependencies to provide dependency-based invalidation.  
The library provides many functionalities, such as:

- Sync and async function executions: if you pass an async function, the library will return a Promise.
- Multi-key association: you can associate multiple keys to the cache entry to have a fine-grained invalidation mechanism.
- Dependency Key Association: you can associate a set of additional keys to the cache entry to have a dependency-based invalidation mechanism.
- Invalidation based on both primary and dependency keys: you can invalidate the cache entry using both one of its keys or one of its dependency keys.
- Invalidation based on TTL: you can set a TTL for each cache entry.
- Invalidation based on threshold: if the cache entry exceeds a certain threshold, the library will invalidate the entry.
- Event emitting mechanism: you can subscribe to events to be notified when a cache entry is added, removed, invalidated, hit, etc..

The library allows both `ESM` (import) and `CommonJS` (require) importing.  
Be warned the ESM version currently uses directory import so, in order to correctly execute it, you should call your node app using the experimental specifier resolution flag:  
`node --experimental-specifier-resolution=node index.js`

```js
import { KeyValueCache } from '@cadienvan/key-value-cache';
const cache = new KeyValueCache();
const users = await cache.exec(fetchUsers, 'users');
cache.setDependencyKeys(
  'users',
  users.map((u) => `users:${u.id}`)
);
await updateUser(2);
cache.invalidateByKey('users:2');
const users = cache.get('users'); // This will be invalidated
```

```js
import { KeyValueCache } from '@cadienvan/key-value-cache';
const cache = new KeyValueCache();
const users = await fetchUsers();
cache.set('users', users, 2); // Define a threshold of 2
cache.setDependencyKeys('users', ['users:1', 'users:2', 'users:3', 'users:4']);
await updateUser(2);
cache.invalidateByKey('users:2');
const users = cache.get('users'); // This will not be invalidated as the threshold is set to 2.
await updateUser(3);
cache.invalidateByKey('users:3');
const users = cache.get('users'); // This will be invalidated as the threshold is set to 2.
```

Look at the `demo` folder in the GitHub Repository in order to have some proofs of concept.

# How do I install it?

You can install it by using the following command:

```bash
npm install @cadienvan/key-value-cache
```

# How can I use it?

You can import and instance a new KeyValueCache object as follows:

```js
import { KeyValueCache } from '@cadienvan/key-value-cache';
const cache = new KeyValueCache();
```

Look at the `demo` folder in the GitHub Repository in order to have some proofs of concept considering both synchronous and asynchronous functions.

# Does it support both sync and async functions?

Yes, it does. You can use it with both synchronous and asynchronous functions.  
Look at the `demo` folder in the GitHub Repository for an example.  
If you pass an async function to the `exec`method, it will return a Promise.  
If you pass a synchronous function to the `exec` method, it will return the value.

# Which parameters are available?

You can pass a parameter to the KeyValueCache, which defines the key separator.  
As the cache is based on a Map, the key separator is used to split every given array key in a single string to allow key matching.

# How can I add an element to the cache?

You can add an element to the cache by using the `exec` method passing a function and a key string or array.  
It firstly searches for the key in the cache, if it is not found, it executes the function and stores the result in the cache.  
In case the key is an array, it searches for a complete match in the cache.

```js
const cache = new KeyValueCache();
cache.exec(() => {
  return longRunningOperation();
}, ['longRunningOperation']); // This will execute the function and store the result in the cache
cache.exec(() => {
  return longRunningOperation();
}, ['longRunningOperation']); // This will return the result directly from the cache
```

If you want to store the result of an async function, just await the result.

```js
const cache = new KeyValueCache();
const result = await cache.exec(
  async () => asyncLongRunningOperation(),
  ['asyncLongRunningOperation']
); // This will execute the async function and store the result in the cache
```

Alternativaly, if you want to store the result of the function in the cache without executing it, you can use the `set` method and pass a straight value.

```js
cache.set('key', 'value');
```

# How can I retrieve an element from the cache?

As per the question above, the `exec` method will return the result directly from the cache if the key is found.  
If you want to retrieve the result directly from the cache, you can use the `get` method.

```js
const cache = new KeyValueCache();
cache.exec(() => {
  return longRunningOperation();
}, ['longRunningOperation']); // This will execute the function and store the result in the cache
cache.get(['longRunningOperation']); // This will return the result directly from the cache
```

# How can I define a threshold for invalidation?

You can simply pass a threshold as the third parameter of the `exec` and `set` methods.  
When the threshold is reached, the item is invalidated.

```js
const cache = new KeyValueCache();
cache.set('key', 'value', 2); // This will store the value in the cache and set the threshold to 2
cache.get('key'); // This will return the value
cache.invalidateByKey('key'); // This won't invalidate the item, but will increase the invalidation counter.
cache.get('key'); // This will return the value
cache.invalidateByKey('key'); // This will invalidate the item as the defined threshold of two is reached.
cache.get('key'); // This will return null
```

Remember to use the `invalidateByKey` method to increase the invalidation counter, while the `delete` method will delete the item from the cache independently from the defined threshold.

# How can I define a TTL for invalidation?

You can pass a TTL as the fifht parameter of the `exec` and `set` methods.  
When the TTL is reached, the item is invalidated.  
Remember the TTL is lazy, so it will be evaluated only when the item is retrieved from the cache.  
As long as the item isn't requested, it will stay there.  
Future updates will provide some sort of background job to invalidate the items.

```js
const cache = new KeyValueCache();
cache.set('key', 'value', 1, [], 1000); // This will store the value in the cache and set the TTL to 1000ms
cache.get('key'); // This will return the value
await sleep(1000); // This will wait for 1000ms
cache.get('key'); // This will return null
```

# What is the difference between the `invalidate` and `invalidateByKey` methods?

The first one will search for exact match between given key and the cache key.  
The second one will search both in the primary keys and in the dependency keys.

```js
const cache = new KeyValueCache();
cache.set('key', 'value', 1, ['depKey']); // This will store the value in the cache.
cache.get('key'); // This will return the value
cache.invalidate('key'); // This will invalidate the item
cache.get('key'); // This will return null
cache.set('key', 'value', 1, ['depKey']); // This will store the value in the cache.
cache.get('key'); // This will return the value
cache.invalidateByKey('depKey'); // This will invalidate the item
cache.get('key'); // This will return null
```

# How can I define a dependency array for invalidation?

You can simply pass a dependency array as the fourth parameter of the `exec` and `set` methods.  
When the dependency array is defined, the item is invalidated when one of the dependencies is invalidated.

```js
const cache = new KeyValueCache();
cache.set('key', 'value', 1, ['dependency1', 'dependency2']); // This will store the value in the cache and set the threshold to 2
cache.get('key'); // This will return the value
cache.invalidateByKey('dependency1'); // This will invalidate the item as the dependency1 is in the dependency array.
cache.get('key'); // This will return null
```

You can also set the dependency array using the `setDependencies` method.

```js
cache.setDependencies('key', ['dependency1', 'dependency2']); // This will set the dependency array for the key
```

This could be useful when you want to firstly execute the function and use the result to set the dependencies.

# How can I remove an element from the cache?

You can remove an element from the cache by using the `delete` method.

```js
cache.delete('key');
```

If you want to invalidate every element in the cache containing a particular key, you can use the `invalidateByKey` method.

```js
cache.invalidateByKey('key');
```

You can also pass a regex to the `invalidateByKey` method in order to invalidate every element in the cache containing a particular key.

```js
cache.invalidateByKey(/key/);
```

# How can I invalidate multiple elements from the cache?

You can invalidate multiple elements from the cache by using the `invalidateByKeys` method.  
This will call the `invalidateByKey` method for every key in the array.

```js
cache.invalidateByKeys(['key1', 'key2']);
```

Because of the iteration, if you invalidate two keys which are part of the same item with a threshold of two, the item will be invalidated.

# How can I clear the cache?

You can clear the cache by using the `clear` method.

```js
cache.clear();
```

# Is there an event emitting mechanism?

Yes, you can use the `eventBus` inside the cache to listen to events.

```js
cache.eventBus.on('onSet', (key) => {
  console.log(`The key ${key} has been saved in the cache`);
});
```

Please, refer to the exported `Events` enum to see the available events.  
Two commodity methods have been provided to listen to the two most common events: `onHit` and `onMiss`, providing a filter for the given key.

```js
cache.onHit((key) => {
  console.log(`The key ${key} has been found in the cache`);
});
cache.onMiss((key) => {
  console.log(`The key ${key} has not been found in the cache`);
});
```

# How can I get the size of the cache?

You can get the size of the cache by using the `size` property.

```js
cache.size;
```

# How can I get the keys of the cache?

You can get the keys of the cache by using the `keys` method.

```js
cache.keys;
```

# How can I get the values of the cache?

You can get the values of the cache by using the `values` method.

```js
cache.values;
```

# How can I get the entries of the cache?

You can get the entries ([key, value] pairs) of the cache by using the `entries` method.

```js
cache.entries;
```

# How can I iterate over the cache?

You can iterate over the cache by using the `forEach` method.

```js
cache.forEach((value, key) => {
  console.log(key, value);
});
```

# How can I check if an element is in the cache?

You can check if an element is in the cache by using the `has` method.

```js
cache.has('key');
```

# Can I make a snapshot of the cache and restore it in a later time?

You can create a snapshot of the cache by using the `snapshot` method.

```js
const snapshot = cache.snapshot();
```

You can optionally pass a boolean to the `snapshot` method to reset the invalidation counter of the items in the snapshot.

```js
const snapshot = cache.snapshot(true);
```

You can restore the snapshot by using the `restore` method.

```js
cache.restore(snapshot);
```

# Does the class support time-based expiration?

No, it doesn't. You can use the [@cadienvan/timed-cache](https://github.com/Cadienvan/timed-cache) library in order to achieve this.

# How does it work under the hood?

The cache is a simple object that stores the results of a function call in memory leveraging the `Map` constructor.  
The cache is key-based, so the results can be invalidated just by calling the correct methods. If the cache is invalidated, the function is re-run and the results are cached again.
