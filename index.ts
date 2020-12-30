import csstree from "css-tree";
import * as fs from "fs";
import * as os from "os";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { iterAllPairs, countSetBits } from "./utils";
import Lazy from "lazy-from";
import { compareSets, intersect, SetCompareResult } from "./set-operations";
import DisjointSets from "./DisjointSets";
import async from "async";
import { Worker, isMainThread, parentPort } from "worker_threads";

const STDIN_FILE_DESCRIPTOR = 0;

export interface WorkerData {
  classRules: MultiMap<string, string>;
  hasNonTrivialCoincidence: Set<string>;
}

async function parseSource() {
  const classRules = new MultiMap<string, string>();

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

    const validSubsets = new DisjointSets<string>();

    let progress = 0;
    const total = classRules.size;
    console.log(`total: ${total}`);
    console.log(`deep: ${classRules.size ** 2}`);

    const threadCount = Math.ceil(os.cpus().length / 2);

    const threads = new Set();
    for (const classRule of classRules) {
      const thread = new Worker(__filename, { workerData: {} });
      threads.add(thread);
      thread.on("error", (err) => {
        throw err;
      });
      thread.on("message", (result: DisjointSets<string>) => {
        // typescript error?
        // @ts-ignore
        for (const subset in result) validSubsets.add(subset as Set<string>);
      });
      thread.on("exit", (err) => {
        threads.delete(thread);
      });
    }

    classRules.entries();

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
