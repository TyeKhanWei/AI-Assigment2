from cli import format_solution, format_trace
from ucs import solve


def test_format_solution_contains_final_answer():
    text = format_solution(solve("A"))
    assert "0 → 2 → 6 → 1 → 5 → 4 → 3" in text
    assert "71" in text
    assert "40.91" in text
    assert "Sunway University" in text


def test_format_solution_route_b():
    text = format_solution(solve("B"))
    assert "75" in text
    assert "39.5" in text


def test_format_trace_shows_expansions():
    text = format_trace(solve("A"))
    assert "g=0" in text          # initial pop
    assert "GOAL" in text         # final line
