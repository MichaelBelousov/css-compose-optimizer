export function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) if (b.has(item)) result.add(item);
  return result;
}

export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) result.add(item);
  for (const item of b) result.add(item);
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
      aHasUnique = aHasUnique || !aVal.done;
      bHasUnique = bHasUnique || !bVal.done;
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
/** third bit is whether they're equal
 * second is whether it's a superset (as opposed to subset)
 * first is whether it's intersecting
 */
export enum SetCompareResult {
  // I probably don't need non-proper since the only difference
  // is it might be equal which is already covered
  Superset        = 0b111,
  ProperSuperset  = 0b011,
  Disjoint        = 0b000,
  Intersecting    = 0b001,
  Equal           = 0b101,
  Subset          = 0b101,
  ProperSubset    = 0b001,
}

export namespace SetCompareResult {
  export function isSuperset(r: SetCompareResult): boolean {
    return [
      SetCompareResult.Superset,
      SetCompareResult.ProperSuperset,
      SetCompareResult.Equal,
    ].includes(r);
  }
  export function isSubset(r: SetCompareResult): boolean {
    return [
      SetCompareResult.Subset,
      SetCompareResult.ProperSubset,
      SetCompareResult.Equal,
    ].includes(r);
  }
  export function isIntersecting(r: SetCompareResult): boolean {
    return !!(r & 0x001);
  }
}
