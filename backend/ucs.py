"""Uniform Cost Search for the House Tour problem, with full step-trace recording.

State      = (current_node, visited_set)  -- visited_set stored as a 7-bit mask.
Initial    = (0, {0})
Goal test  = visited_set contains all 7 nodes (applied when a state is POPPED,
             which is what guarantees UCS optimality).
Actions    = travel from the current node to any other node.
Path cost  = cumulative travel time in minutes (Assignment 1 Tables 1.2/1.3).

Tie-breaking: an insertion counter, with children pushed in ascending node-id
order. This reproduces the Assignment 1 report's trace exactly (0->2 expanded
before the equal-cost 0->6, final path 0->2->6->1->5->4->3).
"""

import heapq

from data import DIST, NODES, TIME, mode

GOAL_MASK = (1 << 7) - 1  # 0b1111111: all seven nodes visited


def _entry(g, path):
    return {"g": g, "path": list(path)}


def _snapshot(frontier):
    return [_entry(g, path) for g, _, _, _, path in sorted(frontier)]


def solve(route):
    """Run UCS on the given route ("A" or "B") and return the full payload:
    {route, nodes, solution, steps} as documented in the trace JSON contract."""
    if route not in TIME:
        raise ValueError(f"route must be one of {sorted(TIME)}, got {route!r}")
    times = TIME[route]

    steps = []
    counter = 0
    settled = set()
    # Heap entries: (g, counter, node, visited_mask, path_tuple)
    frontier = [(0, counter, 0, 1 << 0, (0,))]

    while frontier:
        g, _, node, mask, path = heapq.heappop(frontier)

        if (node, mask) in settled:
            steps.append({
                "type": "prune",
                "popped": _entry(g, path),
                "frontier": _snapshot(frontier),
                "settledCount": len(settled),
            })
            continue
        settled.add((node, mask))

        if mask == GOAL_MASK:
            steps.append({"type": "goal", "popped": _entry(g, path)})
            return {
                "route": route,
                "nodes": NODES,
                "solution": _build_solution(route, g, path),
                "steps": steps,
            }

        pushed, skipped = [], []
        for nxt in range(7):
            if nxt == node:
                continue
            ng = g + times[node][nxt]
            nmask = mask | (1 << nxt)
            npath = path + (nxt,)
            if (nxt, nmask) in settled:
                skipped.append(_entry(ng, npath))
                continue
            counter += 1
            heapq.heappush(frontier, (ng, counter, nxt, nmask, npath))
            pushed.append(_entry(ng, npath))

        steps.append({
            "type": "expand",
            "popped": _entry(g, path),
            "pushed": pushed,
            "skipped": skipped,
            "frontier": _snapshot(frontier),
            "settledCount": len(settled),
        })

    raise RuntimeError("frontier exhausted without reaching the goal (should be impossible)")


def _build_solution(route, total_minutes, path):
    legs = []
    for a, b in zip(path, path[1:]):
        legs.append({
            "from": a,
            "to": b,
            "minutes": TIME[route][a][b],
            "km": DIST[route][a][b],
            "mode": mode(a, b),
        })
    return {
        "path": list(path),
        "totalMinutes": total_minutes,
        "totalKm": round(sum(l["km"] for l in legs), 2),
        "legs": legs,
    }
