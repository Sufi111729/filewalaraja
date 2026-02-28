import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import KbStandaloneApp from "./KbStandaloneApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <KbStandaloneApp />
    <Analytics />
  </React.StrictMode>
);
