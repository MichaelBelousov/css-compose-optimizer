import csstree from "css-tree";
import * as fs from "fs";
import MultiMap from "./MultiMap";
import { iterConsecutivePairs } from "./utils";

// there's got to be a better name for duplicity in graphs like this?
class CoincidenceMatrix {
  private map = new Map<string, Map<string, number>>();

  public incPair(x: string, y: string) {
    if (!this.map.has(x)) this.map.set(x, new Map<string, number>());
    const submap = this.map.get(x)!;
    if (!submap.has(y)) submap.set(y, 0);
    submap.set(y, submap.get(y)! + 1);
  }
}

function parseSource() {
  const coincidence = new CoincidenceMatrix();

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

    //const propIntersections
    for (const [
      [prevRuleName, prevRuleProps],
      [nextRuleName, nextRuleProps],
    ] of iterConsecutivePairs(classRules)) {
      const propIntersection = intersect(prevRuleProps, nextRuleProps);
    }
  }

  console.log(classRules);
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) if (b.has(item)) result.add(item);
  return result;
}

parseSource();
