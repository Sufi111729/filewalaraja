import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import MergePdfApp from "./MergePdfApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MergePdfApp />
    <Analytics />
  </React.StrictMode>
);

