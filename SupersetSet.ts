/** A set of sets, where containing a superset of A is equivalent to
 * membership of A, so inserts of subsets will not grow the container
 */
export default class SupersetSet<T> implements Set<Set<T>> {
  private sets = new Set<Set<T>>();

  /** maps each element to which set owns it */
  private owners = new Map<T, Set<T>>();

  add(value: Set<T>): this {
    throw new Error("Method not implemented.");
  }

  clear(): void {
    this.sets.clear();
  }

  delete(value: Set<T>): boolean {
    return this.sets.delete(value);
  }

  forEach(
    callbackfn: (value: Set<T>, value2: Set<T>, set: Set<Set<T>>) => void,
    thisArg?: any
  ): void {
    throw new Error("Method not implemented.");
  }

  has(value: Set<T>): boolean {
    throw new Error("Method not implemented.");
  }

  get size(): number {
    return this.sets.size;
  }

  [Symbol.iterator](): IterableIterator<Set<T>> {
    throw new Error("Method not implemented.");
  }

  entries(): IterableIterator<[Set<T>, Set<T>]> {
    throw new Error("Method not implemented.");
  }

  keys(): IterableIterator<Set<T>> {
    throw new Error("Method not implemented.");
  }

  values(): IterableIterator<Set<T>> {
    throw new Error("Method not implemented.");
  }

  get [Symbol.toStringTag](): string {
    return this.sets[Symbol.toStringTag];
  }
}
