import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import ConvertPage from "./pages/ConvertPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConvertPage />
    <Analytics />
  </React.StrictMode>
);
