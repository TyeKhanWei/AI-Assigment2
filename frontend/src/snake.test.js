import { describe, expect, it } from "vitest";
import { initialSnake, snakeReducer } from "./snake";

const TOTAL = 6; // pretend the final tour has 6 legs (7 nodes)

describe("snakeReducer", () => {
  it("starts with nothing revealed and not playing", () => {
    expect(initialSnake).toEqual({ revealed: 0, playing: false });
  });

  it("START resets to leg 0 and begins playing", () => {
    const s = snakeReducer({ revealed: 4, playing: false }, { type: "START" });
    expect(s).toEqual({ revealed: 0, playing: true });
  });

  it("TICK reveals one more leg and keeps playing before the last leg", () => {
    let s = { revealed: 0, playing: true };
    s = snakeReducer(s, { type: "TICK", total: TOTAL });
    expect(s).toEqual({ revealed: 1, playing: true });
  });

  it("TICK stops playing once the final leg is revealed", () => {
    let s = { revealed: TOTAL - 1, playing: true };
    s = snakeReducer(s, { type: "TICK", total: TOTAL });
    expect(s).toEqual({ revealed: TOTAL, playing: false });
  });

  it("TICK past the total is a no-op besides pausing", () => {
    const s = snakeReducer({ revealed: TOTAL, playing: true }, { type: "TICK", total: TOTAL });
    expect(s).toEqual({ revealed: TOTAL, playing: false });
  });

  it("STOP pauses without changing revealed", () => {
    const s = snakeReducer({ revealed: 3, playing: true }, { type: "STOP" });
    expect(s).toEqual({ revealed: 3, playing: false });
  });
});
