"""Terminal fallback: run UCS and print the result without the React frontend.

Usage:
    python cli.py --route A
    python cli.py --route B --trace
"""

import argparse
import sys

from ucs import solve


def _path_str(path):
    return " → ".join(str(n) for n in path)


def format_solution(payload):
    sol = payload["solution"]
    nodes = {n["id"]: n for n in payload["nodes"]}
    lines = [
        "=" * 62,
        f"HOUSE TOUR — UNIFORM COST SEARCH (Route {payload['route']})",
        "=" * 62,
        f"Optimal tour : {_path_str(sol['path'])}",
        f"Total time   : {sol['totalMinutes']} minutes",
        f"Total dist.  : {sol['totalKm']} km",
        f"Expansions   : {sum(1 for s in payload['steps'] if s['type'] == 'expand')} states expanded",
        "-" * 62,
    ]
    for i, leg in enumerate(sol["legs"], 1):
        lines.append(
            f"  Leg {i}: {nodes[leg['from']]['name']} → {nodes[leg['to']]['name']}"
            f"  ({leg['minutes']} min, {leg['km']} km, {leg['mode']})"
        )
    lines.append("=" * 62)
    return "\n".join(lines)


def format_trace(payload):
    lines = []
    for i, s in enumerate(payload["steps"]):
        p = s["popped"]
        if s["type"] == "expand":
            lines.append(
                f"[{i:3}] POP  g={p['g']:<3} path={_path_str(p['path']):<28}"
                f" pushed={len(s['pushed'])} skipped={len(s['skipped'])}"
                f" frontier={len(s['frontier'])}"
            )
        elif s["type"] == "prune":
            lines.append(f"[{i:3}] SKIP g={p['g']:<3} path={_path_str(p['path'])} (already settled)")
        else:
            lines.append(f"[{i:3}] GOAL g={p['g']} path={_path_str(p['path'])}")
    return "\n".join(lines)


if __name__ == "__main__":
    # The output uses "→"; redirected output on Windows defaults to cp1252.
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(description="House Tour UCS solver (CLI)")
    parser.add_argument("--route", choices=["A", "B"], default="A", help="which travel-time dataset to use")
    parser.add_argument("--trace", action="store_true", help="print every UCS expansion step")
    args = parser.parse_args()

    payload = solve(args.route)
    if args.trace:
        print(format_trace(payload))
    print(format_solution(payload))
