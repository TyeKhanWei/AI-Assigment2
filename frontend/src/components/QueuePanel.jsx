const MAX_ROWS = 10;

function pathStr(path) {
  return path.join(" → ");
}

export default function QueuePanel({ step, index, total }) {
  const frontier = step.frontier ?? [];
  const shown = frontier.slice(0, MAX_ROWS);

  return (
    <aside className="queue-panel">
      <h2>Step {index + 1} / {total}</h2>

      <div className="event">
        {step.type === "expand" && (
          <>
            <p className="event-title">Pop lowest-cost state</p>
            <p className="event-detail">
              g = <strong>{step.popped.g} min</strong> · path {pathStr(step.popped.path)}
            </p>
            <p className="event-detail">
              visited {"{"}{[...new Set(step.popped.path)].sort().join(", ")}{"}"} ·
              pushed {step.pushed.length} · pruned {step.skipped.length} ·
              settled {step.settledCount}
            </p>
          </>
        )}
        {step.type === "prune" && (
          <>
            <p className="event-title">Stale entry skipped</p>
            <p className="event-detail">
              g = {step.popped.g} · {pathStr(step.popped.path)} — this (node, visited) state
              was already settled via a cheaper path.
            </p>
          </>
        )}
        {step.type === "goal" && (
          <>
            <p className="event-title goal">GOAL reached 🎉</p>
            <p className="event-detail">
              All 7 nodes visited. Optimal tour {pathStr(step.popped.path)} in{" "}
              <strong>{step.popped.g} minutes</strong>.
            </p>
          </>
        )}
      </div>

      {step.type !== "goal" && (
        <>
          <h3>Priority queue — cheapest total time first</h3>
          <ol className="frontier">
            {shown.map((f, i) => (
              <li key={i} className={i === 0 ? "next" : ""}>
                <span className="g">g={f.g}</span>
                <span className="p">{pathStr(f.path)}</span>
                {i === 0 && <span className="next-tag">next</span>}
              </li>
            ))}
          </ol>
          {frontier.length > MAX_ROWS && (
            <p className="more">…and {frontier.length - MAX_ROWS} more entries</p>
          )}
        </>
      )}
    </aside>
  );
}
