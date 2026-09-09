import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Website, { pages } from "../src/site/Website";

import { Assessment } from "../src/pages/Assessment";

export function renderPublicPages() {
  return Object.entries(pages).map(([path, metadata]) => ({
    path, metadata,
    html: renderToString(<MemoryRouter initialEntries={[path]}><Website /></MemoryRouter>),
  })).concat([{ path: "/assessment", metadata: ["AI Operations Assessment", "Assess your operations in about two minutes, then contact Wonder & Workflow to discuss your result."], html: renderToString(<Assessment />) }]);
}
