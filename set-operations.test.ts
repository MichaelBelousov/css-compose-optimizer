import "jest";
import { SetCompareResult, compareSets } from "./set-operations";

// todo: idiomatically, I should extend expect for these

describe("compareSets", () => {
  it("not intersecting", () => {
    expect(
      SetCompareResult.isIntersecting(
        compareSets(new Set([1, 2, 3]), new Set([4, 5, 6]))
      )
    ).toBeFalsy();
  });

  it("empty not intersecting", () => {
    expect(
      SetCompareResult.isIntersecting(
        compareSets(new Set([1, 2, 3]), new Set([4, 5, 6]))
      )
    ).toBeFalsy();
  });

  it("intersecting", () => {
    expect(
      SetCompareResult.isIntersecting(
        compareSets(new Set([1, 2, 3]), new Set([3, 4, 5]))
      )
    ).toBeTruthy();
  });

  it("equal intersecting", () => {
    expect(
      SetCompareResult.isIntersecting(
        compareSets(new Set([1, 2, 3]), new Set([1, 2, 3]))
      )
    ).toBeTruthy();
  });

  it("equal", () => {
    expect(compareSets(new Set([1, 2, 3]), new Set([1, 2, 3]))).toEqual(
      SetCompareResult.Equal
    );
  });

  it("equal", () => {
    expect(compareSets(new Set([1, 2, 3]), new Set([1, 2, 4]))).not.toEqual(
      SetCompareResult.Equal
    );
  });

  it("is subset", () => {
    expect(
      SetCompareResult.isSubset(
        compareSets(new Set([1, 2]), new Set([1, 2, 3]))
      )
    ).toBeTruthy();
  });

  it("equal is subset", () => {
    expect(
      SetCompareResult.isSubset(
        compareSets(new Set([1, 2, 3]), new Set([1, 2, 3]))
      )
    ).toBeTruthy();
  });

  it("not subset", () => {
    expect(
      SetCompareResult.isSubset(
        compareSets(new Set([1, 2, 3, 4]), new Set([1, 2, 3]))
      )
    ).toBeFalsy();
  });

  it("is superset", () => {
    expect(
      SetCompareResult.isSuperset(
        compareSets(new Set([1, 2, 3, 4]), new Set([1, 2, 3]))
      )
    ).toBeTruthy();
  });

  it("equal is superset", () => {
    expect(
      SetCompareResult.isSuperset(
        compareSets(new Set([1, 2, 3]), new Set([1, 2, 3]))
      )
    ).toBeTruthy();
  });

  it("not superset", () => {
    expect(
      SetCompareResult.isSuperset(
        compareSets(new Set([1, 2, 3, 4]), new Set([1, 2, 3, 4, 5]))
      )
    ).toBeFalsy();
  });

  it("disjoint", () => {});

  it("subset", () => {
    expect(
      SetCompareResult.isSubset(
        compareSets(
          new Set([
            "display:flex",
            "justify-content:center",
            "align-items:center",
          ]),
          new Set(["flex-direction:column", "display:flex", "margin:10px 10px"])
        )
      )
    ).toBeFalsy();
  });
});
