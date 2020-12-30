import { countSetBits } from "./utils";
import Lazy from "lazy-from";
import { compareSets, SetCompareResult } from "./set-operations";
import { isMainThread, parentPort, workerData } from "worker_threads";
import type { WorkerData } from "./index";
import DisjointSets from "./DisjointSets";

if (isMainThread) throw Error("this file is only for workers");
if (!parentPort) throw Error("parentPort must be defined in the worker");

const { classRules, hasNonTrivialCoincidence } = workerData as WorkerData;

function* filteredPowerset(set: Iterable<string>, opts = { minimumSize: 0 }) {
  const elements = Lazy.from(set)
    .filter((prop) => hasNonTrivialCoincidence.has(prop))
    .toArray();
  // TODO: if set.length > 32, use an object to check element sizes
  const powersetCount = 2 ** elements.length;
  // uses binary number bits as an existence test
  for (let i = 0; i < powersetCount; ++i) {
    if (countSetBits(i) < opts.minimumSize) continue;
    const thisSet = new Set<string>();
    for (let j = 0; j < elements.length; ++j) {
      if (i & (1 << j)) {
        thisSet.add(elements[j]);
      }
    }
    yield thisSet;
  }
}

const result = new DisjointSets<string>();

for (const [, props] of classRules) {
  for (const subset of filteredPowerset([...props], { minimumSize: 2 })) {
    for (const [, otherProps] of classRules) {
      if (
        props !== otherProps &&
        SetCompareResult.isSubset(compareSets(subset, otherProps))
      ) {
        result.add(subset);
      }
    }
  }
}

parentPort.postMessage(result);
