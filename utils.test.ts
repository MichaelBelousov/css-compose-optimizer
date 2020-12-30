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
});
