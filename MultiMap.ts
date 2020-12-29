// FIXME: looks like produced constructor from `tsc --target es5` doesn't work,
// using es5 for now.
/** a map where each key points to an array of (multiple) values,
 * use the `append` function to append a new single value to that array
 */
export default class MultiMap<K, T> extends Map<K, Set<T>> {
  public append(key: K, value: T): Set<T> {
    if (!this.has(key)) this.set(key, new Set<T>());
    const result = this.get(key)!;
    result.add(value);
    return result;
  }
}
