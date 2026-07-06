import { useReducer } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// CARTO "Positron" light basemap: free for this kind of use, no API key.
// Attribution to OpenStreetMap + CARTO is required and kept visible below.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const ALL_PAIRS = [];
for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) ALL_PAIRS.push([a, b]);

const NODE_R = 16;

function nodeState(id, step, solution) {
  if (solution) return solution.path.includes(id) ? "final" : "idle";
  const path = step.popped.path;
  if (id === path[path.length - 1]) return "expanding";
  if (path.includes(id)) return "path";
  const frontier = step.frontier ?? [];
  if (frontier.some((f) => f.path[f.path.length - 1] === id)) return "frontier";
  return "idle";
}

// SVG drawn over the map; node pixel positions are re-projected from lat/lng
// on every map pan/zoom so the graph stays glued to the geography.
function GraphOverlay({ nodes, step, solution }) {
  const map = useMap();
  const [, force] = useReducer((x) => x + 1, 0);
  useMapEvents({ move: force, zoom: force, resize: force });

  const size = map.getSize();
  const pos = {};
  for (const n of nodes) {
    pos[n.id] = map.latLngToContainerPoint([n.lat, n.lng]);
  }

  const poppedPath = step.popped.path;
  const poppedLast = poppedPath[poppedPath.length - 1];

  const pathEdges = poppedPath.slice(1).map((n, i) => [poppedPath[i], n]);
  const pushEdges =
    step.type === "expand"
      ? step.pushed.map((p) => [poppedLast, p.path[p.path.length - 1]])
      : [];
  const finalEdges = solution
    ? solution.path.slice(1).map((n, i) => [solution.path[i], n])
    : [];
  const finalLegs = solution ? solution.legs : [];

  return (
    <svg className="graph-overlay" width={size.x} height={size.y} role="img" aria-label="UCS search map">
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
        const p = pos[n.id];
        return (
          <g key={n.id} className={`node ${state}`}>
            <circle cx={p.x} cy={p.y} r={NODE_R} />
            <text className="node-id" x={p.x} y={p.y + 5}>{n.id}</text>
            <text className="node-label" x={p.x} y={p.y + NODE_R + 16}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

const LEGEND = [
  ["expanding", "Expanding"],
  ["path", "Tour so far"],
  ["frontier", "In frontier"],
  ["idle", "Unreached"],
  ["final", "Optimal tour"],
];

export default function GraphView({ nodes, step, solution }) {
  const bounds = [
    [Math.min(...nodes.map((n) => n.lat)), Math.min(...nodes.map((n) => n.lng))],
    [Math.max(...nodes.map((n) => n.lat)), Math.max(...nodes.map((n) => n.lng))],
  ];

  return (
    <div className="graph">
      <MapContainer
        className="map"
        bounds={bounds}
        boundsOptions={{ padding: [60, 60] }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains="abcd" maxZoom={19} />
        <GraphOverlay nodes={nodes} step={step} solution={solution} />
      </MapContainer>
      <div className="legend-box">
        {LEGEND.map(([cls, label]) => (
          <div key={cls} className="legend-item">
            <span className={`dot ${cls}`} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
