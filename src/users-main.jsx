import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import UsersCrudApp from "./UsersCrudApp";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UsersCrudApp />
    <Analytics />
  </React.StrictMode>
);
