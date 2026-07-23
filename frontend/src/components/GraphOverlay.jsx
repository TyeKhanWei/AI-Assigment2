import { useEffect, useReducer, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { NODE_R, declutteredPositions } from "../declutter";
import { nodeState } from "../nodeState";
import { SNAKE_LEG_MS } from "../snake";
import { getRoadPath, projectRoadPath } from "../roadGeometry";

const ALL_PAIRS = [];
for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) ALL_PAIRS.push([a, b]);

function toAttr(points) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

// Shortens a polyline's final segment so it stops `gap` px short of its
// endpoint. Without this, an arrowhead (drawn at the true endpoint) ends up
// centered on the node it's pointing at and is mostly hidden behind the
// node circle -- pulling the line back leaves the arrow floating cleanly
// just outside it.
function pullBackEnd(points, gap) {
  if (points.length < 2) return points;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const segLen = Math.hypot(dx, dy);
  if (segLen <= gap) return [...points.slice(0, -1), prev];
  const trimmed = { x: last.x - (dx / segLen) * gap, y: last.y - (dy / segLen) * gap };
  return [...points.slice(0, -1), trimmed];
}

const ARROW_GAP = NODE_R + 6;

// A final-tour leg that draws itself in like a snake growing along the road,
// then fades its minute label in once the line finishes. Re-mounts fresh
// each time it enters `finalEdges` (unique key per node pair), so the
// draw-in effect always plays exactly once per reveal.
function SnakeLeg({ points, minutes, labelAnchor }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const length = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${length}`;
    el.style.strokeDashoffset = `${length}`;
    // Force a reflow so the browser registers the "undrawn" state before we
    // transition it away -- otherwise the two style writes get batched and
    // the line just appears fully drawn with no animation.
    el.getBoundingClientRect();
    el.style.transition = `stroke-dashoffset ${SNAKE_LEG_MS}ms linear`;
    el.style.strokeDashoffset = "0";

    // Once drawn, drop the dash styling entirely. Map pans/zooms
    // re-project this leg's points (changing its path length), and a
    // stale dasharray would turn the now-longer/shorter path into a
    // dashed line instead of solid.
    function clearDash() {
      el.style.transition = "";
      el.style.strokeDasharray = "";
      el.style.strokeDashoffset = "";
    }
    el.addEventListener("transitionend", clearDash, { once: true });
    return () => el.removeEventListener("transitionend", clearDash);
  }, []);

  return (
    <g>
      <polyline ref={ref} className="edge final" markerEnd="url(#arrow-final)" points={toAttr(points)} />
      <text
        className="edge-label snake-label"
        style={{ animationDelay: `${SNAKE_LEG_MS}ms` }}
        x={labelAnchor.x}
        y={labelAnchor.y - 8}
      >
        {minutes} min
      </text>
    </g>
  );
}

// SVG drawn over the map; node pixel positions and road-path polylines are
// re-projected from lat/lng on every map pan/zoom so the graph stays glued
// to the geography.
export default function GraphOverlay({ nodes, step, solution, revealedLegs }) {
  const map = useMap();
  const [, force] = useReducer((x) => x + 1, 0);
  useMapEvents({ move: force, zoom: force, resize: force });

  const size = map.getSize();
  const pos = declutteredPositions(map, nodes);

  // Bends each road path to start/end exactly at its two nodes' actual
  // on-screen marker positions (pos[a]/pos[b]) -- see roadGeometry.js for why
  // that's not automatic (declutter nudging and OSRM's road-snapping can
  // both leave the raw geometry short of the marker).
  function edgePoints(a, b) {
    return projectRoadPath(map, getRoadPath(a, b, nodes), pos[a], pos[b]);
  }

  const poppedPath = step.popped.path;
  const poppedLast = poppedPath[poppedPath.length - 1];

  const pathEdges = poppedPath.slice(1).map((n, i) => [poppedPath[i], n]);
  const pushEdges =
    step.type === "expand"
      ? step.pushed.map((p) => [poppedLast, p.path[p.path.length - 1]])
      : [];
  const finalEdgesAll = solution
    ? solution.path.slice(1).map((n, i) => [solution.path[i], n])
    : [];
  const shownLegs = revealedLegs === undefined ? finalEdgesAll.length : revealedLegs;
  const finalEdges = finalEdgesAll.slice(0, shownLegs);
  const finalLegs = solution ? solution.legs : [];

  return (
    <svg className="graph-overlay" width={size.x} height={size.y} role="img" aria-label="UCS search map">
      <defs>
        <marker id="arrow-path" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="arrow-head arrow-head-path" />
        </marker>
        <marker id="arrow-final" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className="arrow-head arrow-head-final" />
        </marker>
      </defs>

      {/* base edges: faint complete graph, following real roads */}
      {ALL_PAIRS.map(([a, b]) => (
        <polyline key={`base-${a}-${b}`} className="edge base" points={toAttr(edgePoints(a, b).points)} />
      ))}

      {/* edges to children being pushed this step */}
      {!solution && pushEdges.map(([a, b]) => (
        <polyline key={`push-${a}-${b}`} className="edge push" points={toAttr(edgePoints(a, b).points)} />
      ))}

      {/* tour-so-far of the popped state */}
      {!solution && pathEdges.map(([a, b]) => (
        <polyline key={`path-${a}-${b}`} className="edge path" markerEnd="url(#arrow-path)"
          points={toAttr(pullBackEnd(edgePoints(a, b).points, ARROW_GAP))} />
      ))}

      {/* final optimal tour: legs draw in one at a time, snake-style */}
      {finalEdges.map(([a, b], i) => {
        const { points, labelAnchor } = edgePoints(a, b);
        return (
          <SnakeLeg
            key={`final-${a}-${b}`}
            points={pullBackEnd(points, ARROW_GAP)}
            labelAnchor={labelAnchor}
            minutes={finalLegs[i].minutes}
          />
        );
      })}

      {/* nodes */}
      {nodes.map((n) => {
        const state = nodeState(n.id, step, solution, revealedLegs);
        const p = pos[n.id];
        const displaced = Math.hypot(p.x - p.anchor.x, p.y - p.anchor.y) > 4;
        // Nudged-up markers label above so adjacent labels don't collide
        const labelAbove = displaced && p.y < p.anchor.y - 1;
        const labelY = labelAbove ? p.y - NODE_R - 8 : p.y + NODE_R + 16;
        return (
          <g key={n.id} className={`node ${state}`}>
            {displaced && (
              <>
                <line className="anchor-line" x1={p.anchor.x} y1={p.anchor.y} x2={p.x} y2={p.y} />
                <circle className="anchor-dot" cx={p.anchor.x} cy={p.anchor.y} r="3" />
              </>
            )}
            <circle className="node-circle" cx={p.x} cy={p.y} r={NODE_R} />
            <text className="node-id" x={p.x} y={p.y + 5}>{n.id}</text>
            <text className="node-label" x={p.x} y={labelY}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
