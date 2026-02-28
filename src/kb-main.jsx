import React from "react";
import ReactDOM from "react-dom/client";`r`nimport { Analytics } from "@vercel/analytics/react";
import KbStandaloneApp from "./KbStandaloneApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <KbStandaloneApp />
      <Analytics />`r`n  </React.StrictMode>
);
