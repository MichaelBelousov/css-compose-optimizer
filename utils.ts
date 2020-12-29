/** Iterate consecutive pairs from an iterator
 * @example for an iterator [a,b,c] produce [[a,b],[b,c]]
 */
export function* iterConsecutivePairs<T>(iter: Iterable<T>) {
  let lastItem: T | undefined;
  for (const item of iter) {
    if (lastItem) yield [lastItem, item];
    lastItem = item;
  }
}

/** enumerate (return the index of each element of) an iterator
 * like python's enumerate
 * @example for an iterator [a,b,c] produce [[0,a],[1,b],[2,c]]
 */
export function* enumerate<T>(iter: Iterable<T>) {
  let i = 0;
  for (const item of iter) {
    yield [i, item] as const;
    ++i;
  }
}

/** Iterate all unique pairs from an iterator
 * does not include self pairs (i.e. [a,a]) or inverse directional pairs (i.e. both [a,b],[b,a])
 * use a cartesian product for those
 * @example for an iterator [a,b,c] produce [[a,b],[b,c],[a,c]]
 */
export function* iterAllPairs<T>(iter: Iterable<T>) {
  const values = [...iter];
  for (let i = 0; i < values.length; ++i) {
    for (let j = i + 1; j < values.length; ++j) {
      yield [values[i], values[j]] as [T, T];
    }
  }
}

/** iterate all subsets of a set
 * @example for a set [a,b,c] produce [[], [a], [b], [c], [a,b], [b,c], [c,a], [a,b,c]]
 * @warning doesn't currently work for iterables of size > 32
 */
export function* powerSet<T>(iter: Iterable<T>, opts = { minimumSize: 0 }) {
  // TODO: if set.length > 32, use an object to check element sizes
  const set = [...iter];
  const powersetCount = 2 ** set.length;
  // uses binary number bits as an existence test
  for (let i = 0; i < powersetCount; ++i) {
    if (countSetBits(i) < opts.minimumSize) continue;
    const thisSet = new Set<T>();
    for (let j = 0; j < set.length; ++j) {
      if (i & (1 << j)) {
        thisSet.add(set[j]);
      }
    }
    yield thisSet;
  }
}

// prettier-ignore
const bits_per_nibble: Record<number, number> = {
  0: 0, 1: 1, 2: 1, 3: 2, 4: 1, 5: 2, 6: 2, 7: 3,
  8: 1, 9: 2, 10: 2, 11: 3, 12: 2, 13: 3, 14: 3, 15: 4
};

/** e.g. countSetBits(0b1101) === 3 */
export function countSetBits(x: number) {
  if (x === 0xffffffff) return 32;
  let count = 0;
  do {
    count += bits_per_nibble[x & 0xf];
    x >>>= 4;
  } while (x > 16);
  return count;
}
