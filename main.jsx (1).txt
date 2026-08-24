import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// start-it-landing.jsx reads window.__STARTIT_API_BASE__ to decide
// demo mode vs real backend. Setting it here from an env var means
// you configure it once in Render/Vercel's dashboard (VITE_API_BASE)
// and never have to touch this file again per deploy.
window.__STARTIT_API_BASE__ = import.meta.env.VITE_API_BASE || null;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
