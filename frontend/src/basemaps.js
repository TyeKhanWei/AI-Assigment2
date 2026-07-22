// Tile layer configs for the map. Both are free, no API key -- consistent
// with this project's "no API key" approach to the CARTO street tiles.

export const BASEMAPS = [
  {
    id: "street",
    label: "Street",
    // CARTO "Positron" light basemap.
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  },
  {
    id: "satellite",
    label: "Satellite",
    // Esri World Imagery. Note: tile path is {z}/{y}/{x} (y before x),
    // unlike the CARTO layer above. No {s} placeholder in the URL -- single
    // host, so subdomain rotation is never actually used -- but Leaflet's
    // TileLayer._getSubdomain() unconditionally reads options.subdomains
    // .length on every tile regardless of whether the URL template contains
    // {s}, and an explicit `subdomains: undefined` prop shadows its own
    // built-in "abc" default rather than falling through to it. Any non-empty
    // value here prevents that crash; the actual string is otherwise unused.
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    subdomains: "abc",
    maxZoom: 19,
  },
];

export const DEFAULT_BASEMAP = "street";
