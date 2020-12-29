import csstree from "css-tree";
import * as fs from "fs";
import MultiMap from "./MultiMap";
import CompositeMap from "./CompositeMap";
import { iterAllPairs } from "./utils";

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

    const intersections = new CompositeMap<
      readonly [string, string],
      Set<string>
    >();
    for (const [
      [prevRuleName, prevRuleProps],
      [nextRuleName, nextRuleProps],
    ] of iterAllPairs(classRules)) {
      intersections.set(
        [prevRuleName, nextRuleName],
        intersect(prevRuleProps, nextRuleProps)
      );
    }

    console.log("intersections");
    debugMap(intersections);
    console.log("propertyUsers");
    debugMap(propertyUsers);
  }
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) if (b.has(item)) result.add(item);
  return result;
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
