// Pure playback state for stepping through the UCS trace.
// speed = steps advanced per second while playing.

export const initialPlayback = { index: 0, playing: false, speed: 2 };

export function playbackReducer(state, action) {
  switch (action.type) {
    case "PLAY":
      return { ...state, playing: true };
    case "PAUSE":
      return { ...state, playing: false };
    case "RESTART":
      return { ...state, index: 0, playing: false };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "SEEK":
      return { ...state, index: action.index, playing: false };
    case "STEP_FWD":
      return { ...state, index: Math.min(state.index + 1, action.total - 1), playing: false };
    case "STEP_BACK":
      return { ...state, index: Math.max(state.index - 1, 0), playing: false };
    case "SKIP_END":
      return { ...state, index: action.total - 1, playing: false };
    case "TICK": {
      if (state.index >= action.total - 1) return { ...state, playing: false };
      return { ...state, index: state.index + 1 };
    }
    default:
      return state;
  }
}
