import { BASEMAPS } from "../basemaps";

export default function BasemapToggle({ basemap, onBasemap }) {
  return (
    <div className="basemap-toggle" role="group" aria-label="Map style">
      {BASEMAPS.map((b) => (
        <button
          key={b.id}
          type="button"
          className={b.id === basemap ? "active" : ""}
          aria-pressed={b.id === basemap}
          onClick={() => onBasemap(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
