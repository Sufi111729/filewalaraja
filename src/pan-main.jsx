import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import PanEditorStandaloneApp from "./PanEditorStandaloneApp";
import { AiHealthProvider } from "./store/aiHealthStore";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AiHealthProvider>
      <PanEditorStandaloneApp />
    </AiHealthProvider>
    <Analytics />
  </React.StrictMode>
);
