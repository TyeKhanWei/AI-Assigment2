import roadPaths from "./roadPaths.json";

// Looks up the real road/footpath geometry between two nodes, in the exact
// fromId -> toId direction (roadPaths.json stores both directions, generated
// by backend/build_road_paths.py, so no reversal is ever needed here). Falls
// back to a straight line between the two nodes' true coordinates if the pair
// is missing -- e.g. a node added to backend/data.py without rerunning that
// script.
export function getRoadPath(fromId, toId, nodes) {
  const cached = roadPaths[`${fromId}-${toId}`];
  if (cached) return cached;
  const from = nodes.find((n) => n.id === fromId);
  const to = nodes.find((n) => n.id === toId);
  return [[from.lat, from.lng], [to.lat, to.lng]];
}

// Projects a road path's [lat,lng] points to on-screen pixels, then bends the
// whole polyline so it starts exactly at targetFrom and ends exactly at
// targetTo -- the actual on-screen marker positions of its two endpoint
// nodes (declutter.js's possibly-nudged {x,y}, not the raw lat/lng
// projection). Two independent things can otherwise leave a gap between
// where the line ends and where the node circle is drawn: the marker being
// nudged away from its true position to avoid overlapping a neighbor (see
// declutter.js), and OSRM snapping a route's endpoint to the nearest
// *routable road*, which can be tens of meters from a residence's true
// coordinate (a building set back from the street) -- tens of meters is
// upwards of 150px at high zoom, not a subtle mismatch. Both are corrected
// the same way here: compute each endpoint's true pixel projection, then
// blend the (target - rawEndpoint) correction smoothly along cumulative
// pixel-space arc length, 100% at that endpoint, 0% at the far end. When a
// path's raw endpoints already land exactly on both targets, this is a
// no-op.
//
// Also returns labelAnchor, the point at 50% cumulative arc length, reusing
// this same pass -- used to place a curved edge's minute label on the route
// itself instead of the straight-line midpoint between its endpoints.
export function projectRoadPath(map, latlngs, targetFrom, targetTo) {
  const raw = latlngs.map(([lat, lng]) => map.latLngToContainerPoint([lat, lng]));

  const cum = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  }
  const total = cum[cum.length - 1] || 1;

  const last = raw.length - 1;
  const offsetFrom = { x: targetFrom.x - raw[0].x, y: targetFrom.y - raw[0].y };
  const offsetTo = { x: targetTo.x - raw[last].x, y: targetTo.y - raw[last].y };

  const points = raw.map((p, i) => {
    const t = cum[i] / total;
    return {
      x: p.x + offsetFrom.x + (offsetTo.x - offsetFrom.x) * t,
      y: p.y + offsetFrom.y + (offsetTo.y - offsetFrom.y) * t,
    };
  });

  const half = total / 2;
  let labelAnchor = points[points.length - 1];
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= half) {
      const segFrac = (half - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      labelAnchor = {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * segFrac,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * segFrac,
      };
      break;
    }
  }

  return { points: dedupeAdjacent(points), labelAnchor };
}

// Collapses near-duplicate (<=0.5px apart) consecutive points, comparing
// each candidate to the last point actually KEPT (not the raw previous
// index -- comparing by index would let a run of 3+ close points slip
// through). The true first and last points are always preserved exactly
// (points[0] to keep the start-of-path invariant; the final point is kept
// unconditionally too, but if the point immediately before it collapsed
// onto it, that second-to-last point is dropped so the final segment --
// the one the SVG arrowhead's auto-orientation reads -- always has real
// length instead of silently staying degenerate).
function dedupeAdjacent(points) {
  if (points.length <= 2) return points;
  const kept = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = kept[kept.length - 1];
    if (Math.hypot(points[i].x - prev.x, points[i].y - prev.y) > 0.5) {
      kept.push(points[i]);
    }
  }
  const lastPoint = points[points.length - 1];
  const beforeLast = kept[kept.length - 1];
  if (kept.length > 1 && Math.hypot(lastPoint.x - beforeLast.x, lastPoint.y - beforeLast.y) <= 0.5) {
    kept.pop();
  }
  kept.push(lastPoint);
  return kept;
}
