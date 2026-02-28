import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import AdminLoginApp from "./AdminLoginApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminLoginApp />
    <Analytics />
  </React.StrictMode>
);
