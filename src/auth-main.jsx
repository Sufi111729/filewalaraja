import React from "react";
import ReactDOM from "react-dom/client";`r`nimport { Analytics } from "@vercel/analytics/react";
import AuthApp from "./AuthApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthApp />
      <Analytics />`r`n  </React.StrictMode>
);
