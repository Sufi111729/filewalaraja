import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import AiImageScalerPage from "./pages/AiImageScalerPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AiImageScalerPage />
    <Analytics />
  </React.StrictMode>
);
