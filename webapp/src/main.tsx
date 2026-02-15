import { createRoot } from "react-dom/client";
import App from "./App.js";
import "leaflet/dist/leaflet.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
