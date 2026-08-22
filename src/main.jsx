import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { AdminApp } from "./AdminApp.jsx";
import "./styles.css";

const isAdminRoute =
  window.location.pathname.startsWith("/admin") ||
  window.location.hash === "#/admin";
const RootApp = isAdminRoute ? AdminApp : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
