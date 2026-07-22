"""
Generates frontend/src/roadPaths.json: real road/footpath geometry for every
pair of the 7 House Tour nodes, so the frontend can draw edges that follow
actual streets instead of straight lines.

WHY A SEPARATE, MANUALLY-RUN SCRIPT
The physical route between two fixed lat/lng points never changes and does
not depend on which Route A/B time matrix is active or on UCS search
progress, so there is no reason to fetch it at app-run time. This script
fetches it ONCE from the public OSRM demo server and caches the result to a
JSON file committed to the repo. `npm run dev` never talks to OSRM; it only
reads this file -- the running demo has no dependency on OSRM's uptime,
CORS policy, or 1-req/sec rate limit. This matches the project's existing
"map tiles need internet, the algorithm runs fully offline" split (see
README "Map background") -- road geometry now sits on the offline side too.

WHEN TO RERUN
Only if backend/data.py's NODES coordinates change, or a node is added or
removed. Not needed for TIME/DIST/route edits -- those don't affect road
geometry.

    cd backend
    python build_road_paths.py

Takes roughly 30-90 seconds (21 pairs, ~1 request/second so as not to abuse
the free public OSRM server). Requires internet access and `httpx` (already
in requirements.txt). If a pair fails after 3 attempts it falls back to a
straight line between its two endpoints and prints a warning -- rerun later
if you want a real curve for that pair.

Every pair is stored in BOTH directions ("i-j" and "j-i" -- 42 keys for 21
pairs) so the frontend never reverses a cached array at render time; it
just looks up the exact direction it needs.

Only OSRM's route GEOMETRY (the polyline shape) is kept. This project's
authoritative travel time/distance numbers are the Assignment 1 Route A/B
matrices in data.py -- OSRM's own distance/duration fields are discarded
on purpose so there is only ever one source of truth for those numbers.
"""

import json
import time
from pathlib import Path

import httpx

from data import NODES, mode

OSRM_BASE = "https://router.project-osrm.org"
OSRM_PROFILE = {"walk": "foot", "drive": "driving"}
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "frontend" / "src" / "roadPaths.json"
REQUEST_DELAY_SECONDS = 1.1
MAX_ATTEMPTS = 3
TIMEOUT_SECONDS = 10.0


def _pairs():
    """All 21 unordered (i, j) combinations among the 7 nodes, i < j."""
    for i in range(len(NODES)):
        for j in range(i + 1, len(NODES)):
            yield i, j


def _straight_line_fallback(a, b):
    """Pure: two-point [[lat,lng],[lat,lng]] straight line between two nodes."""
    return [[a["lat"], a["lng"]], [b["lat"], b["lng"]]]


def _parse_osrm_response(body):
    """Pure: parsed OSRM /route/v1 JSON -> [[lat,lng], ...], or raises ValueError."""
    if body.get("code") != "Ok" or not body.get("routes"):
        raise ValueError(f"OSRM returned code={body.get('code')!r}")
    coords = body["routes"][0]["geometry"]["coordinates"]  # [[lng, lat], ...]
    return [[lat, lng] for lng, lat in coords]


def fetch_route_geometry(client, a, b):
    """Fetch real road/footpath geometry from a to b, retrying on failure.
    Returns [[lat,lng], ...] or None if every attempt failed."""
    profile = OSRM_PROFILE[mode(a["id"], b["id"])]
    url = f"{OSRM_BASE}/route/v1/{profile}/{a['lng']},{a['lat']};{b['lng']},{b['lat']}"
    params = {"overview": "simplified", "geometries": "geojson"}
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            resp = client.get(url, params=params, timeout=TIMEOUT_SECONDS)
            resp.raise_for_status()
            return _parse_osrm_response(resp.json())
        except Exception as exc:
            print(f"    attempt {attempt}/{MAX_ATTEMPTS} failed: {exc}")
            if attempt < MAX_ATTEMPTS:
                time.sleep(2**attempt)
    return None


def build():
    nodes_by_id = {n["id"]: n for n in NODES}
    result = {}
    fallback_pairs = []
    pairs = list(_pairs())

    print(f"Fetching {len(pairs)} road-path geometries from {OSRM_BASE} ...")
    with httpx.Client() as client:
        for k, (i, j) in enumerate(pairs, 1):
            a, b = nodes_by_id[i], nodes_by_id[j]
            profile = OSRM_PROFILE[mode(i, j)]
            print(f"[{k:2}/{len(pairs)}] {i}-{j}  ({a['label']} <-> {b['label']}, {profile}) ...")

            points = fetch_route_geometry(client, a, b)
            if points is None:
                print(f"    FAILED after {MAX_ATTEMPTS} attempts -- using a straight line")
                points = _straight_line_fallback(a, b)
                fallback_pairs.append(f"{i}-{j}")

            result[f"{i}-{j}"] = points
            result[f"{j}-{i}"] = list(reversed(points))
            time.sleep(REQUEST_DELAY_SECONDS)

    OUTPUT_PATH.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
    print(f"\nWrote {len(result)} directed road paths ({len(pairs)} pairs x 2) to {OUTPUT_PATH}")
    if fallback_pairs:
        print(f"WARNING: {len(fallback_pairs)} pair(s) used a straight-line fallback: {', '.join(fallback_pairs)}")
    else:
        print("All pairs used real OSRM road/footpath geometry.")


if __name__ == "__main__":
    build()
