import pytest

from ucs import solve


def test_route_a_optimal_path_and_cost():
    r = solve("A")
    assert r["solution"]["path"] == [0, 2, 6, 1, 5, 4, 3]
    assert r["solution"]["totalMinutes"] == 71


def test_route_b_optimal_path_and_cost():
    r = solve("B")
    assert r["solution"]["path"] == [0, 2, 6, 1, 5, 4, 3]
    assert r["solution"]["totalMinutes"] == 75


def test_total_distance_side_metric():
    assert solve("A")["solution"]["totalKm"] == pytest.approx(40.91)
    assert solve("B")["solution"]["totalKm"] == pytest.approx(39.5)


def test_legs_are_consistent():
    sol = solve("A")["solution"]
    assert len(sol["legs"]) == 6
    assert sum(l["minutes"] for l in sol["legs"]) == sol["totalMinutes"]
    assert sol["legs"][0] == {"from": 0, "to": 2, "minutes": 3, "km": 0.21, "mode": "walk"}
    assert sol["legs"][-1] == {"from": 4, "to": 3, "minutes": 9, "km": 6.9, "mode": "drive"}


def test_trace_starts_at_initial_state():
    steps = solve("A")["steps"]
    assert steps[0]["type"] == "expand"
    assert steps[0]["popped"] == {"g": 0, "path": [0]}


def test_trace_ends_with_goal():
    steps = solve("A")["steps"]
    assert steps[-1]["type"] == "goal"
    assert steps[-1]["popped"]["g"] == 71
    assert set(steps[-1]["popped"]["path"]) == {0, 1, 2, 3, 4, 5, 6}


def test_frontier_snapshots_are_sorted_and_trace_bounded():
    steps = solve("A")["steps"]
    assert 10 < len(steps) < 2000
    for s in steps:
        if s["type"] in ("expand", "prune"):
            gs = [f["g"] for f in s["frontier"]]
            assert gs == sorted(gs)


def test_report_tie_break_pops_node_2_before_node_6():
    # Assignment 1 report expands 0->2 (g=3) before 0->6 (g=3).
    steps = solve("A")["steps"]
    assert steps[1]["popped"]["path"] == [0, 2]
    assert steps[2]["popped"]["path"] == [0, 6]


def test_invalid_route_raises():
    with pytest.raises(ValueError):
        solve("C")


def test_payload_includes_nodes_and_route():
    r = solve("B")
    assert r["route"] == "B"
    assert len(r["nodes"]) == 7
