import { KeyValueCache } from '.';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function PromiseMockFn(value: string): Promise<string> {
  return new Promise((resolve) => {
    resolve(value);
  });
}

describe('KeyValueCache', () => {
  it('should be defined', () => {
    expect(KeyValueCache).toBeDefined();
  });

  it('should be able to create a new instance', () => {
    const cache = new KeyValueCache();
    expect(cache).toBeDefined();
  });

  it('should be able to set a value', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.get('test')).toBe('value');
  });

  it('should be able to set a value and a ttl', async () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value', 1, [], 1000);
    expect(cache.get('test')).toBe('value');
    await sleep(500);
    expect(cache.get('test')).toBe('value');
    await sleep(700);
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to set a value with a threshold', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value', 2);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('test');
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('test');
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to set a value with a threshold and dependencies', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value', 2, ['dependency']);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to set a value with a threshold and dependencies and ttl', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value', 2, ['dependency'], 1000);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to invalidate multiple keys', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value', 2, ['dependency1']);
    cache.set('test2', 'value', 2, ['dependency2']);
    cache.set('test3', 'value', 2, ['dependency3']);
    expect(cache.get('test')).toBe('value');
    expect(cache.get('test2')).toBe('value');
    expect(cache.get('test3')).toBe('value');
    cache.invalidateByKeys([/dependency.+/]);
    expect(cache.get('test')).toBe(null);
    expect(cache.get('test2')).toBe(null);
    expect(cache.get('test3')).toBe(null);
  });

  it('should be able to delete a key', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.get('test')).toBe('value');
    cache.delete('test');
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to output entries', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.entries).toBeInstanceOf(Array);
  });

  it('should be able to output keys', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.keys).toBeInstanceOf(Array);
  });

  it('should be able to output values', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.values).toBeInstanceOf(Array);
  });

  it('should be able to output size', () => {
    const cache = new KeyValueCache();
    cache.set('test', 'value');
    expect(cache.size).toBe(1);
  });

  it('should be able to exec a function', () => {
    const cache = new KeyValueCache();
    const fn = jest.fn(() => 'value');
    cache.exec(fn, 'test');
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test');
    expect(cache.get('test')).toBe('value'); // Repeat to cover both hit and miss
  });

  it('should be able to exec an async function', async () => {
    const cache = new KeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test');
    expect(cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test');
    expect(cache.get('test')).toBe('value'); // Repeat to cover both hit and miss
  });

  it('should be able to exec a function with a threshold', () => {
    const cache = new KeyValueCache();
    const fn = jest.fn(() => 'value');
    cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('test');
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2);
    expect(fn).toBeCalledTimes(2);
    expect(cache.get('test')).toBe('value');
  });

  it('should be able to exec an async function with a threshold', async () => {
    const cache = new KeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('test');
    expect(cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2);
    expect(cache.get('test')).toBe('value');
  });

  it('should be able to exec a function with a threshold and dependencies', () => {
    const cache = new KeyValueCache();
    const fn = jest.fn(() => 'value');
    cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2, ['dependency']);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
  });

  it('should be able to exec an async function with a threshold and dependencies', async () => {
    const cache = new KeyValueCache();
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    await cache.exec(async () => PromiseMockFn('value'), 'test', 2, [
      'dependency'
    ]);
    expect(cache.get('test')).toBe('value');
  });

  it('should be able to exec a function with a threshold and dependencies and ttl', () => {
    const cache = new KeyValueCache();
    const fn = jest.fn(() => 'value');
    cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    cache.exec(fn, 'test', 2, ['dependency'], 1000);
    expect(fn).toBeCalledTimes(1);
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe(null);
  });

  it('should be able to exec an async function with a threshold and dependencies and ttl', async () => {
    const cache = new KeyValueCache();
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(cache.get('test')).toBe('value');
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(cache.get('test')).toBe('value');
    cache.invalidateByKey('dependency');
    expect(cache.get('test')).toBe('value');
    await cache.exec(
      async () => PromiseMockFn('value'),
      'test',
      2,
      ['dependency'],
      1000
    );
    expect(cache.get('test')).toBe('value');
  });
});
