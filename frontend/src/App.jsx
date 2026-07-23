import { useEffect, useReducer, useState } from "react";
import { fetchSolve } from "./api";
import { initialPlayback, playbackReducer } from "./playback";
import { initialSnake, snakeReducer, SNAKE_LEG_MS } from "./snake";
import Controls from "./components/Controls";
import GraphView from "./components/GraphView";
import QueuePanel from "./components/QueuePanel";
import SummaryBar from "./components/SummaryBar";

export default function App() {
  const [route, setRoute] = useState("A");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pb, dispatch] = useReducer(playbackReducer, initialPlayback);
  const [snake, snakeDispatch] = useReducer(snakeReducer, initialSnake);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    dispatch({ type: "RESTART" });
    fetchSolve(route)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [route]);

  const total = data ? data.steps.length : 0;

  useEffect(() => {
    if (!pb.playing || !data) return;
    const id = setInterval(() => dispatch({ type: "TICK", total }), 1000 / pb.speed);
    return () => clearInterval(id);
  }, [pb.playing, pb.speed, data, total]);

  const atEnd = !!data && pb.index === total - 1;
  const totalLegs = data ? data.solution.legs.length : 0;

  // Auto-play the snake trace the moment the search animation reaches its
  // final step (and again whenever a freshly solved route lands here).
  useEffect(() => {
    if (atEnd) snakeDispatch({ type: "START" });
  }, [atEnd, data]);

  useEffect(() => {
    if (!snake.playing) return;
    const id = setInterval(() => snakeDispatch({ type: "TICK", total: totalLegs }), SNAKE_LEG_MS);
    return () => clearInterval(id);
  }, [snake.playing, totalLegs]);

  if (error) {
    return (
      <div className="notice error">
        <h2>Cannot reach the Python backend</h2>
        <p>({error})</p>
        <p>Start it first: <code>cd backend</code> then <code>python server.py</code></p>
      </div>
    );
  }
  if (!data) return <div className="notice">Running UCS on the Python backend…</div>;

  const step = data.steps[pb.index];

  return (
    <div className="app">
      <header className="topbar">
        <div className="title-block">
          <h1>House Tour — Uniform Cost Search</h1>
          <p className="subtitle">Start at Sunway University · visit all 6 residences · cost = travel time (minutes)</p>
        </div>
        <Controls route={route} onRoute={setRoute} pb={pb} dispatch={dispatch} total={total} />
      </header>
      <main className="content">
        <GraphView
          nodes={data.nodes}
          step={step}
          solution={atEnd ? data.solution : null}
          revealedLegs={snake.revealed}
        />
        <QueuePanel step={step} index={pb.index} total={total} />
      </main>
      {atEnd && (
        <SummaryBar
          solution={data.solution}
          nodes={data.nodes}
          route={route}
          onReplay={() => snakeDispatch({ type: "START" })}
          replaying={snake.playing}
        />
      )}
    </div>
  );
}
