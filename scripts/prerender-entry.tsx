import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import Website, { pages } from "../src/site/Website";
import { structuredData } from "../src/site/SearchContent";

import { LegacyAssessment } from "../src/pages/Assessment";
import { ASSESSMENT_META } from "../src/site/publicOffer";

export function renderPublicPages() {
  return Object.entries(pages).map(([path, metadata]) => ({
    path, metadata, schema: structuredData(path),
    html: renderToString(<MemoryRouter initialEntries={[path]}><Website /></MemoryRouter>),
  })).concat([{ path: "/assessment", metadata: ["Operations Assessment", ASSESSMENT_META], schema: structuredData("/assessment"), html: renderToString(<LegacyAssessment />) }]);
}
