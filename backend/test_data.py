from data import NODES, TIME, DIST, mode


def test_seven_nodes_with_required_fields():
    assert [n["id"] for n in NODES] == [0, 1, 2, 3, 4, 5, 6]
    for n in NODES:
        for key in ("name", "label", "area", "lat", "lng"):
            assert key in n


def test_coordinates_are_in_klang_valley_and_distinct():
    for n in NODES:
        assert 2.95 < n["lat"] < 3.20, f"node {n['id']} lat out of range"
        assert 101.45 < n["lng"] < 101.70, f"node {n['id']} lng out of range"
    # Lagoon View blocks A/B are display-offset so they don't overlap on the map
    coords = {(n["lat"], n["lng"]) for n in NODES}
    assert len(coords) == 7


def test_matrix_shapes_and_positivity():
    for route in ("A", "B"):
        for matrix in (TIME[route], DIST[route]):
            assert len(matrix) == 7
            for i, row in enumerate(matrix):
                assert len(row) == 7
                assert row[i] == 0
                for j, v in enumerate(row):
                    if i != j:
                        assert v > 0, f"{route}[{i}][{j}] must be positive"


def test_spot_values_match_assignment_1_report():
    assert TIME["A"][0][2] == 3      # Sunway -> Lagoon A, walk
    assert TIME["A"][5][1] == 8      # SS2 -> SS4
    assert TIME["A"][4][3] == 9      # Kemuning Utama -> Kota Kemuning
    assert TIME["B"][3][1] == 40     # Kota Kemuning -> SS4
    assert TIME["B"][2][0] == 8      # Lagoon A -> Sunway (asymmetric vs 0->2 == 4)
    assert DIST["A"][5][4] == 23.5
    assert DIST["B"][0][3] == 19.4


def test_transport_modes():
    assert mode(0, 2) == "walk"
    assert mode(2, 6) == "walk"
    assert mode(6, 0) == "walk"
    assert mode(0, 1) == "drive"
    assert mode(3, 4) == "drive"
