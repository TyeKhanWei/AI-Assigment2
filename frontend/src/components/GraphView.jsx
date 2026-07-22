import { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BASEMAPS, DEFAULT_BASEMAP } from "../basemaps";
import BasemapToggle from "./BasemapToggle";
import GraphOverlay from "./GraphOverlay";

const LEGEND = [
  ["expanding", "Expanding"],
  ["path", "Tour so far"],
  ["frontier", "In frontier"],
  ["idle", "Unreached"],
  ["final", "Optimal tour"],
];

export default function GraphView({ nodes, step, solution }) {
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);
  const selected = BASEMAPS.find((b) => b.id === basemap);

  const bounds = [
    [Math.min(...nodes.map((n) => n.lat)), Math.min(...nodes.map((n) => n.lng))],
    [Math.max(...nodes.map((n) => n.lat)), Math.max(...nodes.map((n) => n.lng))],
  ];

  return (
    <div className={`graph${basemap === "satellite" ? " satellite" : ""}`}>
      <MapContainer
        className="map"
        bounds={bounds}
        boundsOptions={{ padding: [60, 60] }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          key={selected.id}
          url={selected.url}
          attribution={selected.attribution}
          subdomains={selected.subdomains}
          maxZoom={selected.maxZoom}
        />
        <GraphOverlay nodes={nodes} step={step} solution={solution} />
      </MapContainer>
      <BasemapToggle basemap={basemap} onBasemap={setBasemap} />
      <div className="legend-box">
        {LEGEND.map(([cls, label]) => (
          <div key={cls} className="legend-item">
            <span className={`dot ${cls}`} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
