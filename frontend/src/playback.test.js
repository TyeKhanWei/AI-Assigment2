import { describe, expect, it } from "vitest";
import { initialPlayback, playbackReducer } from "./playback";

const TOTAL = 5; // pretend the trace has 5 steps (indices 0..4)

describe("playbackReducer", () => {
  it("starts paused at step 0 with default speed", () => {
    expect(initialPlayback).toEqual({ index: 0, playing: false, speed: 2 });
  });

  it("PLAY/PAUSE toggle playing", () => {
    const playing = playbackReducer(initialPlayback, { type: "PLAY" });
    expect(playing.playing).toBe(true);
    expect(playbackReducer(playing, { type: "PAUSE" }).playing).toBe(false);
  });

  it("TICK advances one step and auto-pauses on the last step", () => {
    let s = { index: 3, playing: true, speed: 2 };
    s = playbackReducer(s, { type: "TICK", total: TOTAL });
    expect(s.index).toBe(4);
    s = playbackReducer(s, { type: "TICK", total: TOTAL });
    expect(s).toEqual({ index: 4, playing: false, speed: 2 });
  });

  it("STEP_FWD clamps at the end, STEP_BACK clamps at 0, both pause", () => {
    let s = playbackReducer({ index: 4, playing: true, speed: 2 }, { type: "STEP_FWD", total: TOTAL });
    expect(s).toEqual({ index: 4, playing: false, speed: 2 });
    s = playbackReducer({ index: 0, playing: true, speed: 2 }, { type: "STEP_BACK" });
    expect(s).toEqual({ index: 0, playing: false, speed: 2 });
  });

  it("RESTART returns to step 0 paused, keeping speed", () => {
    const s = playbackReducer({ index: 4, playing: true, speed: 8 }, { type: "RESTART" });
    expect(s).toEqual({ index: 0, playing: false, speed: 8 });
  });

  it("SKIP_END jumps to the last step paused", () => {
    const s = playbackReducer(initialPlayback, { type: "SKIP_END", total: TOTAL });
    expect(s).toEqual({ index: 4, playing: false, speed: 2 });
  });

  it("SEEK sets an arbitrary index and pauses", () => {
    const s = playbackReducer({ index: 0, playing: true, speed: 2 }, { type: "SEEK", index: 2 });
    expect(s).toEqual({ index: 2, playing: false, speed: 2 });
  });

  it("SET_SPEED changes speed only", () => {
    const s = playbackReducer({ index: 1, playing: true, speed: 2 }, { type: "SET_SPEED", speed: 8 });
    expect(s).toEqual({ index: 1, playing: true, speed: 8 });
  });
});
