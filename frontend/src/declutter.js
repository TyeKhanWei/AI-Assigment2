export const NODE_R = 16;

// Markers sit at their true coordinates; when two would collide at the current
// zoom, they are nudged apart on screen and a leader line points back to the
// true pinned location. Zooming in dissolves the nudge naturally.
export function declutteredPositions(map, nodes) {
  const anchors = {};
  const pts = nodes.map((n) => {
    const p = map.latLngToContainerPoint([n.lat, n.lng]);
    anchors[n.id] = p;
    return { id: n.id, x: p.x, y: p.y };
  });
  const MIN = NODE_R * 2 + 10;
  for (let iter = 0; iter < 40; iter++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        let dx = pts[j].x - pts[i].x;
        let dy = pts[j].y - pts[i].y;
        let d = Math.hypot(dx, dy);
        if (d >= MIN) continue;
        if (d < 1e-6) { dx = 1; dy = -1; d = Math.SQRT2; }
        const push = (MIN - d) / 2 / d;
        pts[i].x -= dx * push; pts[i].y -= dy * push;
        pts[j].x += dx * push; pts[j].y += dy * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const pos = {};
  for (const p of pts) pos[p.id] = { x: p.x, y: p.y, anchor: anchors[p.id] };
  return pos;
}
