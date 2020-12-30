import "./test-utils";
import * as Utils from "./utils";

describe("utils", () => {
  // TODO: maybe prefer something like jest-extended's .toIncludeAll() since order shouldn't matter
  it("iterConsecutivePairs", () => {
    expect(Utils.iterConsecutivePairs([1, 2, 3])).toIterateEqually([
      [1, 2],
      [2, 3],
    ]);
  });

  it("enumerate", () => {
    expect(Utils.enumerate([1, 2, 3])).toIterateEqually([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it("iterAllPairs", () => {
    expect(Utils.iterAllPairs([1, 2, 3])).toIterateEqually([
      [1, 2],
      [1, 3],
      [2, 3],
    ]);
  });

  it("powerSet", () => {
    // prettier-ignore
    expect(
      Utils.powerSet([1,2,3])
    ).toIterateEqually([[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]]);
  });

  it("powerSet with minimum size", () => {
    // prettier-ignore
    expect(
      Utils.powerSet([1,2,3], { minimumSize: 2 })
    ).toIterateEqually([[1,2], [1,3], [2,3], [1,2,3]]);
  });

  it("countSetBits positive", () => {
    expect(Utils.countSetBits(0b1101)).toEqual(3);
  });

  it("countSetBits zero", () => {
    expect(Utils.countSetBits(0)).toEqual(0);
  });

  it("countSetBits 0xff", () => {
    expect(Utils.countSetBits(0xff)).toEqual(8);
  });

  it("chunkify exact", () => {
    expect(Utils.chunkify([1, 2, 3, 4, 5, 6], { size: 3 })).toIterateEqually([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it("chunkify extra", () => {
    expect(
      Utils.chunkify([1, 2, 3, 4, 5, 6, 7], { size: 3 })
    ).toIterateEqually([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it("chunkify not enough", () => {
    expect(
      Utils.chunkify([1, 2, 3, 4, 5, 6, 7], { size: 10 })
    ).toIterateEqually([[1, 2, 3, 4, 5, 6, 7]]);
  });

  const makeUniqueIterable = (name: string) => ({
    *[Symbol.iterator]() {},
    get [Symbol.toStringTag]() {
      return name;
    },
  });

  it("eagerEvalNestedIter infinite depth", () => {
    type DeepResult = Generator<number | DeepResult>;
    function* deep(max = 1, next = 1): DeepResult {
      yield next;
      if (next < max) yield deep(max, next + 1);
    }
    expect(Utils.eagerEvalNestedIter(deep(9))).toEqual([
      1,
      [2, [3, [4, [5, [6, [7, [8, [9]]]]]]]],
    ]);
  });

  it("eagerEvalNestedIter depth = 1", () => {
    const [x, y, z] = ["x", "y", "z"].map(makeUniqueIterable);
    // eager eval nested iterators will evaluate nested iterators with realized arrays up to a certain depth
    expect(
      Utils.eagerEvalNestedIter(
        [[1, 2, 3], [[x, y, z]], [[x, y], [[z]]], x, [5, 6, 7]] as any[],
        1
      )
    ).toEqual([[1, 2, 3], [[x, y, z]], [[x, y], [[z]]], [], [5, 6, 7]]);
  });

  it("eagerEvalNestedIter depth = 0", () => {
    // prettier-ignore
    function *_2_3() { yield 2; yield 3; }
    expect(Utils.eagerEvalNestedIter([1, _2_3, 4], 0)).toEqual([1, _2_3, 4]);
  });
});
