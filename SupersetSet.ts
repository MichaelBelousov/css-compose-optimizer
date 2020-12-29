import { compareSets, SetCompareResult, union } from "./set-operations";

/** A set of sets, where containing a superset of A is equivalent to
 * membership of A, so inserts of subsets will not grow the container
 */
export default class SupersetSet<T> extends Set<Set<T>> {
  // TODO: should use a weakmap
  /** maps each element to which set owns it */
  /*
  private owners = new MultiMap<T, Set<T>>();

  // copied params from SetConstructor because not having a syntax
  // for selecting instatiations of generic types is weak sauce
  public constructor(values?: readonly Set<T>[] | null) {
    super(values);
    for (const set of this) {
      for (const item of set) {
        this.owners.append(item, set);
      }
    }
  }
  */

  /***/
  // LOL: this needs good tests
  public add(value: Set<T>): this {
    const iter = this[Symbol.iterator]();
    let iterVal: ReturnType<typeof iter.next> = {
      value: new Set<T>(),
      done: false,
    };
    while (true) {
      iterVal = iter.next();
      if (iterVal.done) break;
      const set = iterVal.value;
      const setCompareResult = compareSets(set, value);
      if (SetCompareResult.isSuperset(setCompareResult)) {
        return this;
      } else if (SetCompareResult.isSubset(setCompareResult)) {
        this.delete(set);
        super.add(value);
        return this;
      } else if (SetCompareResult.isIntersecting(setCompareResult)) {
        const intersectors = [set];
        while (true) {
          iterVal = iter.next();
          if (iterVal.done) break;
          const set = iterVal.value;
          const setCompareResult = compareSets(set, value);
          if (setCompareResult !== SetCompareResult.Disjoint) {
            intersectors.push(set);
          }
        }
        let aggregateUnion = value;
        for (const intersector of intersectors) {
          this.delete(intersector);
          aggregateUnion = union(intersector, value);
        }
        super.add(aggregateUnion);
        return this;
      }
    }
    super.add(value);
    return this;
  }
}
