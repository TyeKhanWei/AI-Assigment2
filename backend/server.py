"""FastAPI server exposing the UCS solver to the React frontend.

Run:  python server.py   (serves on http://127.0.0.1:8000)
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ucs import solve

app = FastAPI(title="House Tour UCS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local demo only
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/solve")
def api_solve(route: str = "A"):
    route = route.upper()
    if route not in ("A", "B"):
        raise HTTPException(status_code=400, detail="route must be 'A' or 'B'")
    return solve(route)


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
