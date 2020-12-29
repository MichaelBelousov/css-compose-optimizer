import csstree from "css-tree";
import * as fs from "fs";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { iterAllPairs, countSetBits } from "./utils";
import Lazy from "lazy-from";
import {
  compareSets,
  intersect,
  isSubset,
  SetCompareResult,
} from "./set-operations";

function parseSource() {
  const classRules = new MultiMap<string, string>();

  const STDIN_FILE_DESCRIPTOR = 0;
  const src = fs.readFileSync(STDIN_FILE_DESCRIPTOR).toString();
  const ast = csstree.parse(src);

  csstree.walk(ast, (node) => {
    if (node.type === "Rule") {
      const props = (() => {
        const result = new Set<string>();
        node.block.children
          .filter((c): c is csstree.Declaration => c.type === "Declaration")
          .map((n: csstree.CssNode) => csstree.generate(n))
          .each((prop) => result.add(prop));
        return result;
      })();
      classRules.set(csstree.generate(node.prelude), props);
    }
  });

  {
    const propertyUsers = new MultiMap<string, string>();
    for (const [ruleName, props] of classRules) {
      for (const prop of props) {
        propertyUsers.append(prop, ruleName);
      }
    }

    /** inverse of propertyUsers */
    const sharedProperties = new Map<string, string>();
    for (const [prop, classes] of propertyUsers) {
      sharedProperties.set(`${[...classes]}`, prop);
    }

    const intersections = new CompositeMap<[string, string], Set<string>>();
    for (const [
      [prevRuleName, prevRuleProps],
      [nextRuleName, nextRuleProps],
    ] of iterAllPairs(classRules)) {
      intersections.set(
        [prevRuleName, nextRuleName],
        intersect(prevRuleProps, nextRuleProps)
      );
    }

    // this is probably an NP-complete problem

    const hasNonTrivialCoincidence = new Set<string>();
    const propCoincidences = new CompositeMap<[string, string], number>();
    for (const [prop] of propertyUsers)
      for (const [, props] of classRules)
        if (props.has(prop))
          for (const p of props) {
            const prevCoincidence = propCoincidences.get([prop, p]) ?? 0;
            propCoincidences.set([prop, p], prevCoincidence + 1);
            const nontrivialCoincidenceThreshold = 0;
            if (p !== prop && prevCoincidence > nontrivialCoincidenceThreshold)
              hasNonTrivialCoincidence.add(prop);
          }

    function* validSubsets(set: string[], opts = { minimumSize: 0 }) {
      set = set.filter((prop) => hasNonTrivialCoincidence.has(prop));
      // TODO: if set.length > 32, use an object to check element sizes
      const powersetCount = 2 ** set.length;
      // uses binary number bits as an existence test
      for (let i = 0; i < powersetCount; ++i) {
        if (countSetBits(i) < opts.minimumSize) continue;
        const thisSet = new Set<string>();
        for (let j = 0; j < set.length; ++j) {
          if (i & (1 << j)) {
            thisSet.add(set[j]);
          }
        }
        yield thisSet;
      }
    }

    // need some kind of hashable set keyed structure for efficient checking of subsets
    const validSubsets = [];
    for (const [ruleName, props] of classRules) {
      for (const subset of validSubsets([...props], { minimumSize: 2 })) {
        for (const [, otherProps] of classRules) {
          if (
            props !== otherProps &&
            SetCompareResult.isSubset(compareSets(subset, otherProps))
          ) {
            console.log(subset);
          }
        }
      }
    }

    //console.log("intersections");
    //debugMap(intersections);
    //console.log("propertyUsers");
    //debugMap(propertyUsers);
    //console.log("sharedProperties");
    //console.log(sharedProperties);
    //console.log("propCoincidences");
    //console.log(propCoincidences);
  }
}

function debugMap<K, T>(mapOfIters: Map<K, Iterable<T>>) {
  const strings = ["CompositeMap {"];
  for (const [key, value] of mapOfIters) {
    strings.push(`\t${key} => ${[...value]}`);
  }
  strings.push("}");
  console.log(strings.join("\n"));
}

parseSource();
