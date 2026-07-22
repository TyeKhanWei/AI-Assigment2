// Classifies a node's visual state (idle/frontier/expanding/path/final) from
// the current UCS trace step, or from the final solution once search ends.
export function nodeState(id, step, solution) {
  if (solution) return solution.path.includes(id) ? "final" : "idle";
  const path = step.popped.path;
  if (id === path[path.length - 1]) return "expanding";
  if (path.includes(id)) return "path";
  const frontier = step.frontier ?? [];
  if (frontier.some((f) => f.path[f.path.length - 1] === id)) return "frontier";
  return "idle";
}
