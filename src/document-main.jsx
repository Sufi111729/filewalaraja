import React from "react";
import ReactDOM from "react-dom/client";`r`nimport { Analytics } from "@vercel/analytics/react";
import DocumentStandaloneApp from "./DocumentStandaloneApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DocumentStandaloneApp />
      <Analytics />`r`n  </React.StrictMode>
);
