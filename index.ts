import csstree from "css-tree";
import * as fs from "fs";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { iterAllPairs, countSetBits } from "./utils";
import Lazy from "lazy-from";
import { compareSets, intersect, SetCompareResult } from "./set-operations";
import SupersetSet from "./SupersetSet";
import async from "async";

async function parseSource() {
  const classRules = new MultiMap<string, string>();

  const STDIN_FILE_DESCRIPTOR = 0;
  const STDOUT_FILE_DESCRIPTOR = 1;
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

    function* filteredPowerset(set: string[], opts = { minimumSize: 0 }) {
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
        if (thisSet.size > 15) console.log(thisSet.size);
        yield thisSet;
      }
    }

    const validSubsets = new SupersetSet<string>();

    let progress = 0;
    let deepProgress = 0;
    const total = classRules.size;
    console.log(`total: ${total}`);
    console.log(`deep: ${classRules.size ** 2}`);

    const result: Set<string>[][][] = await async.map(
      classRules.entries(),
      async ([, props]) => {
        const result = await async.map(
          filteredPowerset([...props], { minimumSize: 2 }),
          async (subset) =>
            await async.map(classRules.entries(), async ([, otherProps]) => {
              if (
                props !== otherProps &&
                SetCompareResult.isSubset(compareSets(subset, otherProps))
              ) {
                ++deepProgress;
                process.stdout.write(
                  "\r" +
                    `${deepProgress}/${classRules.size ** 2}`.padStart(30, " ")
                );
                return subset;
              }
            })
        );

        ++progress;
        process.stdout.write("\r" + `${progress}/${total}`.padStart(30, " "));

        return result;
      }
    );

    console.log(result);

    const affectedRules = new MultiMap<Set<string>, string>();

    for (const validSubset of validSubsets)
      for (const [ruleName, props] of classRules)
        if (SetCompareResult.isSubset(compareSets(validSubset, props))) {
          affectedRules.append(validSubset, ruleName);
        }

    console.log(affectedRules);
  }
}

parseSource();
