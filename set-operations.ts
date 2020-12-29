export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) if (b.has(item)) result.add(item);
  return result;
}

export function compareSets<T>(a: Set<T>, b: Set<T>): SetCompareResult {
  let aHasUnique = false;
  let haveIntersection = false; // FIXME: may be incorrect with empty sets
  let bHasUnique = false;
  // weird interleaving to optimize returning early
  const aIter = a[Symbol.iterator]();
  const bIter = b[Symbol.iterator]();
  while (true) {
    const aVal = aIter.next();
    const bVal = bIter.next();
    if (aVal.done || bVal.done) {
      aHasUnique ||= !aVal.done;
      bHasUnique ||= !bVal.done;
      // prettier-ignore
      return   haveIntersection &&  aHasUnique &&  bHasUnique ? SetCompareResult.Intersecting
            :  haveIntersection &&  aHasUnique && !bHasUnique ? SetCompareResult.ProperSuperset
            :  haveIntersection && !aHasUnique &&  bHasUnique ? SetCompareResult.ProperSubset
            :  haveIntersection && !aHasUnique && !bHasUnique ? SetCompareResult.Equal
            : !haveIntersection &&  aHasUnique &&  bHasUnique ? SetCompareResult.Disjoint
            : (() => { throw Error("unreachable") })();
    }
    if (!a.has(bVal.value)) bHasUnique = true;
    else haveIntersection = true;
    if (!b.has(aVal.value)) aHasUnique = true;
    else haveIntersection = true;
    if (aHasUnique && bHasUnique) {
      return haveIntersection
        ? SetCompareResult.Intersecting
        : SetCompareResult.Disjoint;
    }
  }
}

// prettier-ignore
/** third bit is whether it's proper
 * second is whether it's a superset (as opposed to subset)
 * third is whether it's intersecting
 */
export enum SetCompareResult {
  // I probably don't need non-proper since the only difference
  // is it might be equal which is already covered
  Superset        = 0b010,
  ProperSuperset  = 0b110,
  Disjoint        = 0b000,
  Intersecting    = 0b001,
  Equal           = 0b000,
  Subset          = 0b000,
  ProperSubset    = 0b100,
}

export namespace SetCompareResult {
  export function isSuperset(r: SetCompareResult) {
    return !!(r & 0x010);
  }
  export function isSubset(r: SetCompareResult) {
    return !(r & 0x010);
  }
  export function isIntersecting(r: SetCompareResult) {
    return !!(r & 0x100);
  }
}