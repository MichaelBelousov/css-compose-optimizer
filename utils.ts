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
