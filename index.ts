import csstree from "css-tree";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { chunkify, iterAllPairs } from "./utils";
import { compareSets, intersect, SetCompareResult } from "./set-operations";
import SetsSet from "./SetsSet";
import { Worker } from "worker_threads";

const STDIN_FILE_DESCRIPTOR = 0;

export interface WorkerData {
  hasNonTrivialCoincidence: Set<string>;
}

export interface WorkerJob {
  classRules: [string, Set<string>][];
}

async function parseSource() {
  const classRules = new MultiMap<string, string>();

  const src = fs.readFileSync(STDIN_FILE_DESCRIPTOR).toString();
  const ast = csstree.parse(src);

  csstree.walk(ast, (node) => {
    if (
      node.type === "Rule" &&
      node.prelude.type === "SelectorList" &&
      node.prelude.children.last()?.type === "ClassSelector"
    ) {
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

    const validSubsets = new SetsSet();

    const threadCount = Math.ceil(os.cpus().length / 2);
    const threads = new Set<Worker>();

    const jobs = chunkify(classRules, { size: 100 });

    const getNextJob = (): WorkerJob | undefined => {
      const next = jobs.next();
      if (!next.done) {
        const eagerChunk = [...next.value];
        return { classRules: eagerChunk };
      }
    };

    await new Promise<void>((resolve, reject) => {
      for (let i = 0; i < threadCount; ++i) {
        const job = getNextJob();

        if (!job) break;

        const thread = new Worker(path.join(__dirname, "worker.js"), {
          workerData: { hasNonTrivialCoincidence } as WorkerData,
        });

        threads.add(thread);

        thread.on("error", (err) => {
          reject(err);
        });

        thread.on("message", (result: SetsSet) => {
          for (const subset of result) validSubsets.add(subset);
          const nextJob = getNextJob();
          if (nextJob) thread.postMessage(nextJob);
          else thread.terminate();
        });

        thread.on("exit", (code) => {
          console.log(`thread ${i} exited with code: ${code}`);
          threads.delete(thread);
          if (threads.size === 0) {
            console.log("threads finished");
            resolve();
          }
        });

        thread.postMessage(job);
      }
    });

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
