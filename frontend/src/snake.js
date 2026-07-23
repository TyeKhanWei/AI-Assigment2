// Pure playback state for the "snake" reveal of the final optimal tour:
// once UCS finishes, legs of the winning path draw in one at a time instead
// of appearing all at once. Mirrors playback.js's shape/conventions.

export const SNAKE_LEG_MS = 1200; // fixed pace per leg, independent of leg minutes

export const initialSnake = { revealed: 0, playing: false };

export function snakeReducer(state, action) {
  switch (action.type) {
    case "START":
      return { revealed: 0, playing: true };
    case "TICK": {
      if (state.revealed >= action.total) return { ...state, playing: false };
      const revealed = state.revealed + 1;
      return { revealed, playing: revealed < action.total };
    }
    case "STOP":
      return { ...state, playing: false };
    default:
      return state;
  }
}
