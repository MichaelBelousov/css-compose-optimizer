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
    this.rootMap.forEach((submapOrValue, firstkey) => {
      let key = [firstkey];
      if (submapOrValue instanceof CompositeMap) {
        const submap = submapOrValue;
        submap.forEach((v, k, m) => {
          callbackfn.call(thisArg, v, (key.concat(k) as any) as K, m);
        });
      } else {
        callbackfn.call(thisArg, submapOrValue, (key as any) as K, this);
      }
    });
  }

  get(key: K): T | undefined {
    let cursor: any = this.rootMap;
    for (const subkey of key) {
      if (!cursor.has(subkey)) break;
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
      if (!cursor.has(subkey)) cursor.set(subkey, new CompositeMap<K, T>());
      cursor = cursor.get(subkey);
    }
    const finalSubkey = key[key.length - 1];
    cursor.set(finalSubkey, value);
    return this;
  }

  get size(): number {
    throw new Error("Method not implemented.");
  }

  [Symbol.iterator](): IterableIterator<[K, T]> {
    throw new Error("Method not implemented.");
  }

  entries(): IterableIterator<[K, T]> {
    return this.entriesHelper([]);
  }

  private *entriesHelper(keys: any[]): IterableIterator<[K, T]> {
    for (const [subkey, submapOrValue] of this.rootMap.entries()) {
      if (submapOrValue instanceof CompositeMap) {
        const submap = submapOrValue;
        keys!.push(subkey);
        yield* submap.entries() as any;
        keys.pop();
      } else {
        const value = submapOrValue;
        yield [(keys as any) as K, value];
      }
    }
  }

  *keys(): IterableIterator<K> {
    for (const [key] of this.entries()) {
      yield key;
    }
  }

  *values(): IterableIterator<T> {
    for (const [, value] of this.entries()) {
      yield value;
    }
  }

  get [Symbol.toStringTag]() {
    return this.rootMap[Symbol.toStringTag];
  }
}
