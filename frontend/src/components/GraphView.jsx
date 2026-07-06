const ALL_PAIRS = [];
for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) ALL_PAIRS.push([a, b]);

function nodeState(id, step, solution) {
  if (solution) return solution.path.includes(id) ? "final" : "idle";
  const path = step.popped.path;
  if (id === path[path.length - 1]) return "expanding";
  if (path.includes(id)) return "path";
  const frontier = step.frontier ?? [];
  if (frontier.some((f) => f.path[f.path.length - 1] === id)) return "frontier";
  return "idle";
}

export default function GraphView({ nodes, step, solution }) {
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const poppedPath = step.popped.path;
  const poppedLast = poppedPath[poppedPath.length - 1];

  // Edges of the tour-so-far for the state being expanded
  const pathEdges = poppedPath.slice(1).map((n, i) => [poppedPath[i], n]);
  // Edges lighting up toward newly pushed children
  const pushEdges =
    step.type === "expand"
      ? step.pushed.map((p) => [poppedLast, p.path[p.path.length - 1]])
      : [];
  const finalEdges = solution
    ? solution.path.slice(1).map((n, i) => [solution.path[i], n])
    : [];
  const finalLegs = solution ? solution.legs : [];

  return (
    <svg className="graph" viewBox="0 0 900 560" role="img" aria-label="UCS search map">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="arrow-head" />
        </marker>
      </defs>

      {/* base edges: faint complete graph */}
      {ALL_PAIRS.map(([a, b]) => (
        <line key={`base-${a}-${b}`} className="edge base"
          x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}

      {/* edges to children being pushed this step */}
      {!solution && pushEdges.map(([a, b]) => (
        <line key={`push-${a}-${b}`} className="edge push"
          x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}

      {/* tour-so-far of the popped state */}
      {!solution && pathEdges.map(([a, b]) => (
        <line key={`path-${a}-${b}`} className="edge path" markerEnd="url(#arrow)"
          x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
      ))}

      {/* final optimal tour */}
      {finalEdges.map(([a, b], i) => {
        const midX = (pos[a].x + pos[b].x) / 2;
        const midY = (pos[a].y + pos[b].y) / 2;
        return (
          <g key={`final-${a}-${b}`}>
            <line className="edge final" markerEnd="url(#arrow)"
              x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} />
            <text className="edge-label" x={midX} y={midY - 8}>
              {finalLegs[i].minutes} min
            </text>
          </g>
        );
      })}

      {/* nodes */}
      {nodes.map((n) => {
        const state = nodeState(n.id, step, solution);
        return (
          <g key={n.id} className={`node ${state}`}>
            <circle cx={n.x} cy={n.y} r="24" />
            <text className="node-id" x={n.x} y={n.y + 5}>{n.id}</text>
            <text className="node-label" x={n.x} y={n.y + 44}>{n.label}</text>
          </g>
        );
      })}

      {/* legend */}
      <g className="legend" transform="translate(20, 20)">
        {[
          ["expanding", "Expanding"],
          ["path", "Tour so far"],
          ["frontier", "In frontier"],
          ["idle", "Unreached"],
          ["final", "Optimal tour"],
        ].map(([cls, label], i) => (
          <g key={cls} className={`node ${cls}`} transform={`translate(0, ${i * 26})`}>
            <circle cx="8" cy="0" r="8" />
            <text className="legend-label" x="24" y="4">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
