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
