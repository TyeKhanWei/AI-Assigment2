# House Tour — Uniform Cost Search Visualizer

CSC3206 Artificial Intelligence, Assignment 2 (May 2026 semester).

Finds the optimal tour that starts at Sunway University (Node 0) and visits
all six group members' residences (Nodes 1–6) at least once, minimizing total
travel time. The search algorithm is **Uniform Cost Search (UCS)**, implemented
in **Python**, using the Route A / Route B travel-time data collected in
Assignment 1. A **React** frontend animates the search step by step.

## Expected results

| Dataset | Optimal tour | Total time | Total distance |
|---------|--------------|-----------|----------------|
| Route A | 0 → 2 → 6 → 1 → 5 → 4 → 3 | 71 minutes | 40.91 km |
| Route B | 0 → 2 → 6 → 1 → 5 → 4 → 3 | 75 minutes | 39.5 km |

## Prerequisites

- Python 3.10+ (tested on 3.13)
- Node.js 18+ (tested on 24) — only needed for the animated frontend

## Quick start (animated visualizer)

Terminal 1 — Python backend (runs UCS, serves the trace):

    cd backend
    pip install -r requirements.txt
    python server.py

Terminal 2 — React frontend:

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. Use **Play / Pause / step / seek / speed** to watch
UCS expand states, and the **Route A/B** selector to switch datasets.

On Windows, `start-demo.bat` opens both terminals for you (run `pip install`
and `npm install` once first).

## Text-only fallback (no Node.js required)

    cd backend
    python cli.py --route A          # summary only
    python cli.py --route B --trace  # every UCS expansion + summary

## Running the tests

    cd backend  && pytest        # 27 tests: data integrity, UCS optimality, trace, API, road-path generator
    cd frontend && npm test      # 19 tests: playback reducer, node-state classifier, road-path geometry

## Map background

The graph is drawn over a real map of the Bandar Sunway / Petaling Jaya /
Shah Alam area (Leaflet, free, no API key), with a **Street / Satellite**
toggle in the top-right corner of the map. Street uses CARTO/OpenStreetMap
tiles; Satellite uses Esri World Imagery. Loading either set of map tiles
requires an internet connection; the UCS algorithm itself runs fully
offline. All nodes are pinned at their true coordinates. Sunway University
and Lagoon View blocks A/B are within ~160 m of each other, so at low zoom
the display nudges overlapping markers apart and draws a dotted leader line
back to the true pinned location; zooming in restores the exact positions.

Edges follow real roads and footpaths (via OpenStreetMap routing data, see
"How it works" below) rather than straight lines between nodes, so the map
reflects the actual streets the Route A/B times were measured over.

## How it works

- `backend/data.py` — the 7 nodes (with real lat/lng coordinates) and the
  Route A/B time (min) and distance (km) matrices from Assignment 1
  Tables 1.2/1.3.
- `backend/ucs.py` — UCS over states `(current_node, visited_set)`; priority
  queue keyed on cumulative travel time g(n); goal test on dequeue; records
  every pop/push/prune plus a frontier snapshot so the frontend can animate it.
- `backend/server.py` — FastAPI endpoint `GET /api/solve?route=A|B`.
- `backend/build_road_paths.py` — one-off script that fetches real road/
  footpath geometry for every pair of nodes from the public OSRM routing
  server and caches it to `frontend/src/roadPaths.json` (committed, so the
  running app never depends on OSRM). Only rerun this if a node's
  coordinates change — see the script's own docstring.
- `frontend/` — React app that fetches the trace once and plays it back
  (no algorithm logic in JavaScript).
