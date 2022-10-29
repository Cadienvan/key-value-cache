import { AsyncKeyValueCache } from './async';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function PromiseMockFn(value: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(value);
  });
}

describe('AsyncKeyValueCache', () => {
  it('should be defined', () => {
    expect(AsyncKeyValueCache).toBeDefined();
  });

  it('should be able to create a new instance', () => {
    const cache = new AsyncKeyValueCache();
    expect(cache).toBeDefined();
  });

  it('should be able to set a value', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.get('test')).toBe('value');
  });

  it('should be able to clear the cache', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    await cache.clear();
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to set a value and a ttl', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value', 1, [], 1000);
    expect(await cache.get('test')).toBe('value');
    await sleep(500);
    expect(await cache.get('test')).toBe('value');
    await sleep(700);
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to set a value with a threshold', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value', 2);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('test');
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('test');
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to set a value with a threshold and dependencies', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value', 2, ['dependency']);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to set a value with a threshold and dependencies and ttl', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value', 2, ['dependency'], 1000);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to invalidate multiple keys', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value', 2, ['dependency1']);
    await cache.set('test2', 'value', 2, ['dependency2']);
    await cache.set('test3', 'value', 2, ['dependency3']);
    expect(await cache.get('test')).toBe('value');
    expect(await cache.get('test2')).toBe('value');
    expect(await cache.get('test3')).toBe('value');
    await cache.invalidateByKeys([/dependency.+/]);
    expect(await cache.get('test')).toBe('value');
    expect(await cache.get('test2')).toBe('value');
    expect(await cache.get('test3')).toBe('value');
    await cache.invalidateByKeys([/dependency.+/]);
    expect(await cache.get('test')).toBeNull();
    expect(await cache.get('test2')).toBeNull();
    expect(await cache.get('test3')).toBeNull();
  });

  it('should be able to delete a key', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.get('test')).toBe('value');
    await cache.delete('test');
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to output entries', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.entries()).toBeInstanceOf(Object);
  });

  it('should be able to output keys', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.keys()).toBeInstanceOf(Object);
  });

  it('should be able to output values', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.values()).toBeInstanceOf(Object);
  });

  it('should be able to output size', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.set('test', 'value');
    expect(await cache.size()).toBe(1);
  });

  it('should be able to exec a function', async () => {
    const cache = new AsyncKeyValueCache();
    const fn = jest.fn(() => 'value');
    await cache.exec(fn, 'test');
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test');
    expect(await cache.get('test')).toBe('value'); // Repeat to cover both hit and miss
  });

  it('should be able to exec an async function', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test');
    expect(await cache.get('test')).toBe('value'); // Repeat to cover both hit and miss
  });

  it('should be able to exec a function with a threshold', async () => {
    const cache = new AsyncKeyValueCache();
    const fn = jest.fn(() => 'value');
    await cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('test');
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('test');
    await cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(2);
    expect(await cache.get('test')).toBe('value');
  });

  it('should be able to exec an async function with a threshold', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('test');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(await cache.get('test')).toBe('value');
  });

  it('should be able to exec a function with a threshold and dependencies', async () => {
    const cache = new AsyncKeyValueCache();
    const fn = jest.fn(() => 'value');
    await cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
  });

  it('should be able to exec an async function with a threshold and dependencies', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(await cache.get('test')).toBe('value');
  });

  it('should be able to exec a function with a threshold and dependencies and ttl', async () => {
    const cache = new AsyncKeyValueCache();
    const fn = jest.fn(() => 'value');
    await cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBeNull();
  });

  it('should be able to exec an async function with a threshold and dependencies and ttl', async () => {
    const cache = new AsyncKeyValueCache();
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(await cache.get('test')).toBe('value');
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(await cache.get('test')).toBe('value');
    await cache.invalidateByKey('dependency');
    expect(await cache.get('test')).toBe('value');
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(await cache.get('test')).toBe('value');
  });
});
