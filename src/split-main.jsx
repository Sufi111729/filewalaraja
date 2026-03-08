import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import SplitPdfApp from "./SplitPdfApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SplitPdfApp />
    <Analytics />
  </React.StrictMode>
);

