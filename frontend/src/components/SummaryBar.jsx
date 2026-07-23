export default function SummaryBar({ solution, nodes, route, onReplay, replaying }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <footer className="summary">
      <div className="summary-head">
        <span className="badge">Route {route} — optimal tour found</span>
        <span className="totals">
          <strong>{solution.totalMinutes} minutes</strong> · {solution.totalKm} km
        </span>
        <button className="replay-btn" onClick={onReplay} disabled={replaying}>
          ↻ Trace tour
        </button>
      </div>
      <div className="summary-path">
        {solution.path.map((id, i) => (
          <span key={i}>
            {i > 0 && <span className="sep"> → </span>}
            <span className="stop">{byId[id].label}</span>
          </span>
        ))}
      </div>
      <div className="summary-legs">
        {solution.legs.map((l, i) => (
          <span key={i} className="leg">
            {l.mode === "walk" ? "🚶" : "🚗"} {l.from}→{l.to}: {l.minutes} min / {l.km} km
          </span>
        ))}
      </div>
    </footer>
  );
}
