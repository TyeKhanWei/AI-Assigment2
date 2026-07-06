const BASE = "http://127.0.0.1:8000";

export async function fetchSolve(route) {
  let res;
  try {
    res = await fetch(`${BASE}/api/solve?route=${route}`);
  } catch {
    throw new Error("backend not reachable on port 8000");
  }
  if (!res.ok) throw new Error(`backend returned HTTP ${res.status}`);
  return res.json();
}
