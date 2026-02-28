import React from "react";
import ReactDOM from "react-dom/client";`r`nimport { Analytics } from "@vercel/analytics/react";
import ConvertPage from "./pages/ConvertPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvertPage />
      <Analytics />`r`n  </React.StrictMode>
);
