import "jest";

declare global {
  namespace jest {
    interface Matchers<R> {
      toIterateEqually(expected: Iterable<any>): R;
    }
  }
}

function iterResultEq(a: any, b: any) {
  if (a === b) return true;
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    Symbol.iterator in a &&
    Symbol.iterator in b
  ) {
    return doIterateEqually(a[Symbol.iterator](), b[Symbol.iterator]());
  }
  return false;
}

function doIterateEqually(
  received: Iterable<any>,
  expected: Iterable<any>
):
  | {
      pass: false;
      firstBadIndex: number;
      received: IteratorResult<any>;
      expected: IteratorResult<any>;
    }
  | { pass: true } {
  const received_iter = received[Symbol.iterator]();
  const expected_iter = expected[Symbol.iterator]();
  let iter_count = 0;
  const MAX_ITER_COUNT = 10000;
  while (iter_count < MAX_ITER_COUNT) {
    const received_item = received_iter.next();
    const expected_item = expected_iter.next();
    if (
      !iterResultEq(received_item.value, expected_item.value) ||
      received_item.done !== expected_item.done
    ) {
      return {
        pass: false,
        firstBadIndex: iter_count,
        received: received_item,
        expected: expected_item,
      };
    }
    if (received_item.done && expected_item.done) break;
    iter_count++;
    if (iter_count >= MAX_ITER_COUNT) throw Error("potentially iterable");
  }
  // pass must be true if we get here
  return { pass: true };
}

expect.extend({
  toIterateEqually(inReceived: Iterable<any>, inExpected: Iterable<any>) {
    const test = doIterateEqually(inReceived, inExpected);
    return {
      message: () =>
        test.pass
          ? `expected iterators to not be the same`
          : `index ${test.firstBadIndex} had differing values \`${test.received.value}\` (received) and \`${test.expected.value}\` (expected)`,
      pass: test.pass,
    };
  },
});

export {};
