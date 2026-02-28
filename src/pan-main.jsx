import React from "react";
import ReactDOM from "react-dom/client";`r`nimport { Analytics } from "@vercel/analytics/react";
import PanEditorStandaloneApp from "./PanEditorStandaloneApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PanEditorStandaloneApp />
      <Analytics />`r`n  </React.StrictMode>
);
