# What is this?

A simple in-memory key-value cache for function execution, allowing both sync and async operations using the same methods. It provides an invalidation mechanism based both on exact string and regex.

# How do I install it?

You can install it by using the following command:

```bash
npm install @cadienvan/key-value-cache
```

# Why did you build it?

I wanted to build a simple key-value cache mechanism with low footprint and easy to use. I also wanted to be able to use it both synchronously and asynchronously.

# How can I use it?

You can import and instance a new KeyValueCache object as follows:

```js
import { KeyValueCache } from "@cadienvan/key-value-cache";
const cache = new KeyValueCache();
```

Look at the `demo` folder in the GitHub Repository in order to have some proofs of concept considering both synchronous and asynchronous functions.

# Does it support async functions?

Yes, it does. You can use it with both synchronous and asynchronous functions.  
Look at the `demo` folder in the GitHub Repository for an example.

# Which parameters are available?

You can pass a parameter to the KeyValueCache, which defines the key separator.  
As the cache is based on a Map, the key separator is used to split every given array key in a single string.  


# How can I add an element to the cache?

You can add an element to the cache by using the `exec` method passing a function and a key string or array.  
It firstly searches for the key in the cache, if it is not found, it executes the function and stores the result in the cache.  
In case the key is an array, it searches for a complete match in the cache.  

```js
const cache = new KeyValueCache();
cache.exec(() => {
    return longRunningOperation();
}, ["longRunningOperation"]); // This will execute the function and store the result in the cache
cache.exec(() => {
    return longRunningOperation();
}, ["longRunningOperation"]); // This will return the result directly from the cache
```

Alternativaly, if you want to store the result of the function in the cache without executing it, you can use the `set` method.

```js
cache.set("key", "value");
```


# How can I retrieve an element from the cache?

As per the question above, the `exec` method will return the result directly from the cache if the key is found.  
If you want to retrieve the result directly from the cache, you can use the `get` method.

```js
const cache = new KeyValueCache();
cache.exec(() => {
    return longRunningOperation();
}, ["longRunningOperation"]); // This will execute the function and store the result in the cache
cache.get(["longRunningOperation"]); // This will return the result directly from the cache
```

# How can I remove an element from the cache?

You can remove an element from the cache by using the `delete` method.

```js
cache.delete("key");
```

If you want to remove every element in the cache containing a particular key, you can use the `deleteByKey` method.

```js
cache.deleteByKey("key");
```

You can also pass a regex to the `deleteByKey` method in order to remove every element in the cache containing a particular key.

```js
cache.deleteByKey(/key/);
```

# How can I remove multiple elements from the cache?

You can remove multiple elements from the cache by using the `deleteByKeys` method.  
This will call the `deleteByKey` method for every key in the array.

```js
cache.deleteByKeys(["key1", "key2"]);
```

# How can I clear the cache?

You can clear the cache by using the `clear` method.

```js
cache.clear();
```

# How can I get the size of the cache?

You can get the size of the cache by using the `size` property.

```js
cache.size;
```

# How can I get the keys of the cache?

You can get the keys of the cache by using the `keys` method.

```js
cache.keys();
```

# How can I get the values of the cache?

You can get the values of the cache by using the `values` method.

```js
cache.values();
```

# How can I get the entries of the cache?

You can get the entries ([key, value] pairs) of the cache by using the `entries` method.

```js
cache.entries();
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
cache.has("key");
```

# Does the class support time-based expiration?

No, it doesn't. You can use the [@cadienvan/timed-cache](https://github.com/Cadienvan/timed-cache) library in order to achieve this.

# How does it work under the hood?

The cache is a simple object that stores the results of a function call in memory leveraging the `Map` constructor.  
The cache is key-based, so the results can be invalidated just by calling the correct methods. If the cache is invalidated, the function is re-run and the results are cached again.
