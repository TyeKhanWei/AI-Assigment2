from fastapi.testclient import TestClient

from server import app

client = TestClient(app)


def test_solve_route_a():
    r = client.get("/api/solve", params={"route": "A"})
    assert r.status_code == 200
    data = r.json()
    assert data["solution"]["totalMinutes"] == 71
    assert data["steps"][-1]["type"] == "goal"
    assert len(data["nodes"]) == 7


def test_solve_route_b_lowercase_accepted():
    r = client.get("/api/solve", params={"route": "b"})
    assert r.status_code == 200
    assert r.json()["solution"]["totalMinutes"] == 75


def test_invalid_route_rejected():
    r = client.get("/api/solve", params={"route": "X"})
    assert r.status_code == 400
