import * as crypto from "crypto";
import Lazy from "lazy-from";

const setHashKey = Symbol("set-hash");

// FIXME: this stopgap should be replaced with a class deriving from Set
// that invalidates/recalcs the hash on mutation methods (add/delete/clear) etc
declare global {
  interface Set<T> {
    readonly [setHashKey]?: string;
  }
}

function getSetHash(set: Set<string>): string {
  if (setHashKey in set) return set[setHashKey]!;
  const hash = crypto.createHash("sha1");
  Lazy.from(set)
    .sort()
    .forEach((item) => hash.update(`${item}`));
  const digest = hash.digest().toString();
  (set as any)[setHashKey] = digest;
  return digest;
}

/** A set of sets */
export default class SetsSet extends Set<Set<string>> {
  // this needs tests
  public add(value: Set<string>): this {
    const valueHash = getSetHash(value);
    for (const set of this) {
      const setHash = getSetHash(set);
      if (setHash === valueHash) return this;
    }
    super.add(value);
    return this;
  }
}
