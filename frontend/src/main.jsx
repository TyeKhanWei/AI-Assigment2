import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// No StrictMode: react-leaflet's MapContainer can double-initialize under
// StrictMode's dev double-mount ("Map container is already initialized").
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
