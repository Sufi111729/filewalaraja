import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import DocumentStandaloneApp from "./DocumentStandaloneApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DocumentStandaloneApp />
    <Analytics />
  </React.StrictMode>
);
