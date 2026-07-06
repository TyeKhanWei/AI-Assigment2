import { useEffect, useReducer, useState } from "react";
import { fetchSolve } from "./api";
import { initialPlayback, playbackReducer } from "./playback";
import Controls from "./components/Controls";
import GraphView from "./components/GraphView";
import QueuePanel from "./components/QueuePanel";
import SummaryBar from "./components/SummaryBar";

export default function App() {
  const [route, setRoute] = useState("A");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [pb, dispatch] = useReducer(playbackReducer, initialPlayback);

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
  const atEnd = pb.index === total - 1;

  return (
    <div className="app">
      <header className="topbar">
        <h1>House Tour — Uniform Cost Search</h1>
        <Controls route={route} onRoute={setRoute} pb={pb} dispatch={dispatch} total={total} />
      </header>
      <main className="content">
        <GraphView nodes={data.nodes} step={step} solution={atEnd ? data.solution : null} />
        <QueuePanel step={step} index={pb.index} total={total} />
      </main>
      {atEnd && <SummaryBar solution={data.solution} nodes={data.nodes} route={route} />}
    </div>
  );
}
