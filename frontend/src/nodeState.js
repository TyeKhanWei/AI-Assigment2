// Classifies a node's visual state (idle/frontier/expanding/path/final) from
// the current UCS trace step, or from the final solution once search ends.
// `revealedLegs` lets the caller reveal the final tour node-by-node (snake
// animation) instead of all at once; omit it (or pass the full leg count) to
// show the whole solved path immediately.
export function nodeState(id, step, solution, revealedLegs) {
  if (solution) {
    const shown = revealedLegs === undefined ? solution.path.length : revealedLegs + 1;
    return solution.path.slice(0, shown).includes(id) ? "final" : "idle";
  }
  const path = step.popped.path;
  if (id === path[path.length - 1]) return "expanding";
  if (path.includes(id)) return "path";
  const frontier = step.frontier ?? [];
  if (frontier.some((f) => f.path[f.path.length - 1] === id)) return "frontier";
  return "idle";
}
