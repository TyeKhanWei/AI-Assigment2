import { describe, expect, it } from "vitest";
import { nodeState } from "./nodeState";

const step = {
  popped: { g: 16, path: [0, 2, 6] },
  frontier: [{ g: 20, path: [0, 2, 1] }],
};

describe("nodeState", () => {
  it("marks the last node of the popped path as expanding", () => {
    expect(nodeState(6, step, null)).toBe("expanding");
  });

  it("marks earlier nodes of the popped path as path", () => {
    expect(nodeState(0, step, null)).toBe("path");
    expect(nodeState(2, step, null)).toBe("path");
  });

  it("marks the last node of a frontier entry as frontier", () => {
    expect(nodeState(1, step, null)).toBe("frontier");
  });

  it("marks everything else as idle mid-search", () => {
    expect(nodeState(3, step, null)).toBe("idle");
  });

  it("once solved, marks nodes on the final path as final and the rest idle", () => {
    const solution = { path: [0, 2, 6, 1, 5, 4, 3] };
    expect(nodeState(4, step, solution)).toBe("final");
    expect(nodeState(1, step, solution)).toBe("final");
    // The real app's solution always spans all 7 nodes, but the function's
    // branch is general-purpose -- exercise it with a partial path too.
    expect(nodeState(3, step, { path: [0, 2, 6] })).toBe("idle");
  });

  it("with revealedLegs, only shows nodes the snake has reached so far", () => {
    const solution = { path: [0, 2, 6, 1, 5, 4, 3] };
    // 0 legs revealed -> only the start node (0) is final
    expect(nodeState(0, step, solution, 0)).toBe("final");
    expect(nodeState(2, step, solution, 0)).toBe("idle");
    // 2 legs revealed -> nodes 0, 2, 6 are final; the rest still idle
    expect(nodeState(6, step, solution, 2)).toBe("final");
    expect(nodeState(1, step, solution, 2)).toBe("idle");
    // fully revealed (all 6 legs) -> matches the no-arg behaviour
    expect(nodeState(3, step, solution, 6)).toBe("final");
  });
});
