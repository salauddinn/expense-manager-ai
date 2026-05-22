import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { analytics } from "./lib/analytics";

analytics.init();

// Developer attribution signature in console
if (typeof window !== "undefined") {
  console.log(
    "%c FinTrack %c by @salauddinn %c https://github.com/salauddinn/expense-manager-ai ",
    "background:#4361ee;color:#fff;padding:4px 6px;border-radius:4px 0 0 4px;font-weight:bold;font-family:sans-serif",
    "background:#2ec4b6;color:#fff;padding:4px 6px;font-weight:bold;font-family:sans-serif",
    "background:#f1f5f9;color:#64748b;padding:4px 6px;border-radius:0 4px 4px 0;font-family:sans-serif"
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
