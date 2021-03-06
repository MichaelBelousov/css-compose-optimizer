// TODO: look into prefering/combining https://www.npmjs.com/package/composite-map
/** a map where each keys can be composite
 */
export default class CompositeMap<K extends readonly any[], T>
  implements Map<K, T> {
  private rootMap = new Map<K[0], any>();

  clear(): void {
    this.rootMap.clear();
  }

  delete(key: K): boolean {
    const lastSubkey = key[key.length - 1];

    let cursor: any = this.rootMap;
    for (const subkey of key.slice(0, -1)) {
      cursor = cursor.get(subkey);
      if (cursor === undefined) break;
    }
    if (cursor !== undefined) return cursor.delete(lastSubkey);
    else return false;
  }

  forEach(
    callbackfn: (value: T, key: K, map: Map<K, T>) => void,
    thisArg?: any
  ): void {
    for (const [k, v] of this) callbackfn.call(thisArg, v, k, this);
  }

  get(key: K): T | undefined;
  get(key: any[]): Map<any, any>;
  get(key: K | any[]): T | undefined | Map<any, any> {
    let cursor: any = this.rootMap;
    for (const subkey of key) {
      if (!cursor.has(subkey)) return undefined;
      cursor = cursor.get(subkey)!;
    }
    return cursor;
  }

  has(key: K): boolean {
    let cursor: any = this.rootMap;
    for (const subkey of key) {
      if (!cursor.has(subkey)) return false;
      cursor = cursor.get(subkey)!;
    }
    return true;
  }

  set(key: K, value: T): this {
    let cursor: any = this.rootMap;
    for (const subkey of key.slice(0, -1)) {
      if (!cursor.has(subkey)) cursor.set(subkey, new Map<any, any>());
      cursor = cursor.get(subkey);
    }
    const finalSubkey = key[key.length - 1];
    cursor.set(finalSubkey, value);
    return this;
  }

  /** @warning this is very slow, it iterates the entire tree */
  get size(): number {
    let size = 0;
    for (const _ of this) ++size;
    return size;
  }

  [Symbol.iterator](): IterableIterator<[K, T]> {
    return this.entries();
  }

  entries(): IterableIterator<[K, T]> {
    return CompositeMap.entriesHelper(this.rootMap);
  }

  private static *entriesHelper<K, T>(
    map: Map<K, T>,
    subkeys = [] as any[]
  ): IterableIterator<[K, T]> {
    for (const [subkey, submapOrValue] of map.entries()) {
      const key = subkeys.concat(subkey);
      if (submapOrValue instanceof Map) {
        const submap = submapOrValue;
        yield* CompositeMap.entriesHelper(submap, key);
      } else {
        const value = submapOrValue;
        yield [(key as any) as K, value];
      }
    }
  }

  *keys(): IterableIterator<K> {
    for (const [key] of this) yield key;
  }

  *values(): IterableIterator<T> {
    for (const [, value] of this) yield value;
  }

  get [Symbol.toStringTag](): string {
    return this.rootMap[Symbol.toStringTag];
  }
}
