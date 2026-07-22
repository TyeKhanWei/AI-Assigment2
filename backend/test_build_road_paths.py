"""Tests for build_road_paths.py's pure helpers only -- never the network
calls (fetch_route_geometry/build), so this suite stays offline and
deterministic like the rest of the backend tests."""

import pytest

from build_road_paths import _parse_osrm_response, _pairs, _straight_line_fallback
from data import NODES


def test_pairs_covers_all_21_unordered_combinations():
    pairs = list(_pairs())
    assert len(pairs) == 21
    assert len(set(pairs)) == 21
    assert all(i < j for i, j in pairs)


def test_pairs_matches_node_count():
    n = len(NODES)
    assert len(list(_pairs())) == n * (n - 1) // 2


def test_straight_line_fallback_uses_endpoint_coordinates():
    a = {"lat": 1.0, "lng": 2.0}
    b = {"lat": 3.0, "lng": 4.0}
    assert _straight_line_fallback(a, b) == [[1.0, 2.0], [3.0, 4.0]]


def test_parse_osrm_response_reorders_lng_lat_to_lat_lng():
    body = {
        "code": "Ok",
        "routes": [{"geometry": {"coordinates": [[101.60, 3.07], [101.61, 3.08]]}}],
    }
    assert _parse_osrm_response(body) == [[3.07, 101.60], [3.08, 101.61]]


def test_parse_osrm_response_rejects_non_ok_code():
    with pytest.raises(ValueError):
        _parse_osrm_response({"code": "NoRoute", "routes": []})


def test_parse_osrm_response_rejects_missing_routes():
    with pytest.raises(ValueError):
        _parse_osrm_response({"code": "Ok", "routes": []})
