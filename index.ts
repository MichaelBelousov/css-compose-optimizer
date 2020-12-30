import csstree from "css-tree";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { chunkify, eagerEvalNestedIter, iterAllPairs } from "./utils";
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

export type FromWorkerMessage =
  | {
      type: "addSubset";
      subset: SetsSet;
    }
  | {
      type: "next";
    };

export type ToWorkerMessage = {
  job: WorkerJob;
};

async function parseSource() {
  const classRules = new MultiMap<string, string>();

  const src = fs.readFileSync(STDIN_FILE_DESCRIPTOR).toString();
  const ast = csstree.parse(src);

  csstree.walk(ast, (node) => {
    if (node.type === "Rule" && node.prelude.type === "SelectorList") {
      (node.prelude.children as csstree.List<csstree.Selector>).forEach(
        (selector) => {
          if (selector.children.last()?.type === "ClassSelector") {
            const props = (() => {
              const result = new Set<string>();
              node.block.children
                .filter(
                  (c): c is csstree.Declaration => c.type === "Declaration"
                )
                .map((n: csstree.CssNode) => csstree.generate(n))
                .each((prop) => result.add(prop));
              return result;
            })();
            classRules.set(csstree.generate(selector), props);
          }
        }
      );
    }
  });

  console.log(`viable rule count: ${classRules.size}`);

  {
    const propertyUsers = new MultiMap<string, string>();
    for (const [ruleName, props] of classRules) {
      for (const prop of props) {
        propertyUsers.append(prop, ruleName);
      }
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

    const threadCount = os.cpus().length - 1 || 1;
    const threads = new Set<Worker>();

    const jobs = eagerEvalNestedIter(
      chunkify(classRules, { size: 100 }) as Iterable<[string, Set<string>]>,
      2
    ) as [string, Set<string>][][];

    const getNextJob = (): WorkerJob | undefined => {
      const next = jobs.shift();
      if (next) {
        return { classRules: next };
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

        thread.on("message", (msg: FromWorkerMessage) => {
          switch (msg.type) {
            case "addSubset":
              for (const subset of msg.subset) validSubsets.add(subset);
              break;
            case "next":
              const nextJob = getNextJob();
              if (nextJob)
                thread.postMessage({ job: nextJob } as ToWorkerMessage);
              else thread.terminate();
          }
        });

        thread.on("exit", (code) => {
          console.log(`thread ${i} exited with code: ${code}`);
          threads.delete(thread);
          if (threads.size === 0) {
            console.log("threads finished");
            resolve();
          }
        });

        thread.postMessage({ job } as ToWorkerMessage);
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
