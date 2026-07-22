import { describe, expect, it } from "vitest";
import { getRoadPath, projectRoadPath } from "./roadGeometry";

const nodes = [
  { id: 0, lat: 3.0672, lng: 101.6039 },
  { id: 1, lat: 3.1095, lng: 101.6037 },
  { id: 99, lat: 1.0, lng: 2.0 }, // not present in roadPaths.json
];

describe("getRoadPath", () => {
  it("returns a cached pair's geometry, reversed exactly for the opposite direction", () => {
    // Holds regardless of whether OSRM succeeded or this pair fell back to a
    // straight line at generation time -- never asserts on the point count,
    // which depends on network conditions when build_road_paths.py last ran.
    const forward = getRoadPath(0, 1, nodes);
    const backward = getRoadPath(1, 0, nodes);
    expect(backward).toEqual([...forward].reverse());
  });

  it("falls back to a straight line between true coordinates for a pair missing from the cache", () => {
    expect(getRoadPath(0, 99, nodes)).toEqual([
      [3.0672, 101.6039],
      [1.0, 2.0],
    ]);
    // Fallback is built fresh in the requested direction -- not reversed.
    expect(getRoadPath(99, 0, nodes)).toEqual([
      [1.0, 2.0],
      [3.0672, 101.6039],
    ]);
  });
});

// Deterministic stub: no real Leaflet map needed to test the projection math.
const stubMap = { latLngToContainerPoint: ([lat, lng]) => ({ x: lng, y: lat }) };

describe("projectRoadPath", () => {
  const latlngs = [
    [0, 0],
    [0, 10],
    [0, 20],
  ];
  // Raw projected points (via stubMap) are {x:0,y:0}, {x:10,y:0}, {x:20,y:0}.

  it("when targets already match the raw geometry's own endpoints, is a no-op", () => {
    const { points } = projectRoadPath(stubMap, latlngs, { x: 0, y: 0 }, { x: 20, y: 0 });
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 20, y: 0 },
    ]);
  });

  it("bends the path so it starts/ends exactly at arbitrary targets, even when the raw geometry's own endpoints are elsewhere", () => {
    // Regression test for the real bug this function exists to fix: OSRM
    // snaps a route's endpoint to the nearest road, which can be tens of
    // meters -- tens of pixels at typical zoom -- from where the node's
    // marker is actually drawn. targetFrom/targetTo here deliberately do NOT
    // equal the raw endpoints {x:0,y:0}/{x:20,y:0}, simulating that gap.
    const targetFrom = { x: 5, y: -5 };
    const targetTo = { x: -3, y: 8 };
    const { points } = projectRoadPath(stubMap, latlngs, targetFrom, targetTo);
    expect(points[0]).toEqual(targetFrom);
    expect(points[points.length - 1]).toEqual(targetTo);
  });

  it("labelAnchor sits at 50% cumulative arc length of the raw geometry", () => {
    const { labelAnchor } = projectRoadPath(stubMap, latlngs, { x: 0, y: 0 }, { x: 20, y: 0 });
    expect(labelAnchor).toEqual({ x: 10, y: 0 });
  });

  it("collapses a near-duplicate point immediately before the end, so the final segment (which the SVG arrowhead reads) always has real length", () => {
    // The last two raw points are 0.1px apart -- degenerate for arrowhead
    // orientation. The true endpoint must still come out exactly right.
    const withCloseTail = [
      [0, 0],
      [0, 10],
      [0, 19.9],
      [0, 20],
    ];
    const { points } = projectRoadPath(stubMap, withCloseTail, { x: 0, y: 0 }, { x: 20, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 20, y: 0 }); // true endpoint preserved
    const secondLast = points[points.length - 2];
    const dist = Math.hypot(20 - secondLast.x, 0 - secondLast.y);
    expect(dist).toBeGreaterThan(0.5); // final segment is not degenerate
  });
});
