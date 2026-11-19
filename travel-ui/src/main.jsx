import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import "./tourism/Fonts.css";
import "./index.css";
import "./tourism/Readability.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "./tourism/GuardianTheme.css";
import "./tourism/Cinematic.css";
import { syncDocumentLanguage } from "./i18n/store.js";

syncDocumentLanguage();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>
);
