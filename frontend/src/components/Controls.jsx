const SPEEDS = [1, 2, 4, 8];

export default function Controls({ route, onRoute, pb, dispatch, total }) {
  return (
    <div className="controls">
      <label className="route-switch">
        Route
        <select value={route} onChange={(e) => onRoute(e.target.value)}>
          <option value="A">A</option>
          <option value="B">B</option>
        </select>
      </label>

      <button onClick={() => dispatch({ type: "RESTART" })} title="Restart">⟲</button>
      <button onClick={() => dispatch({ type: "STEP_BACK" })} title="Step back">⏮</button>
      {pb.playing ? (
        <button className="primary" onClick={() => dispatch({ type: "PAUSE" })}>⏸ Pause</button>
      ) : (
        <button className="primary" onClick={() => dispatch({ type: "PLAY" })}>▶ Play</button>
      )}
      <button onClick={() => dispatch({ type: "STEP_FWD", total })} title="Step forward">⏭</button>
      <button onClick={() => dispatch({ type: "SKIP_END", total })} title="Skip to result">⇥ End</button>

      <label className="speed">
        Speed
        <select value={pb.speed} onChange={(e) => dispatch({ type: "SET_SPEED", speed: Number(e.target.value) })}>
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
      </label>

      <input
        className="seek"
        type="range"
        min="0"
        max={total - 1}
        value={pb.index}
        onChange={(e) => dispatch({ type: "SEEK", index: Number(e.target.value) })}
      />
    </div>
  );
}
