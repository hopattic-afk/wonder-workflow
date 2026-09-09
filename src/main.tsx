import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import "./styles/app.css";
const App = lazy(() => import("./App"));
const Assessment = lazy(() =>
  import("./pages/Assessment").then((module) => ({
    default: module.LegacyAssessment,
  })),
);
const Website = lazy(() => import("./site/Website"));
function SiteOrWorkspace() {
  const { pathname } = useLocation();
  // Keep the historical recovery origin usable with its existing browser data.
  const legacyRoot = pathname === "/" && window.location.hostname === "mccann-ai-operations.netlify.app";
  return legacyRoot || /^\/(workspace|audit|meetings|settings)(\/|$)/.test(pathname)
    ? <App /> : <Website />;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense
        fallback={
          <p role="status" style={{ padding: 32 }}>
            Opening Wonder &amp; Workflow…
          </p>
        }
      >
        <Routes>
          <Route path="/assessment/*" element={<Assessment />} />
          <Route path="/*" element={<SiteOrWorkspace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
