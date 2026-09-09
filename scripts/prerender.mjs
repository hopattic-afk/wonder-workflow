import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
try {
  const { renderPublicPages } = await server.ssrLoadModule("/scripts/prerender-entry.tsx");
  const template = await readFile("dist/index.html", "utf8");
  // Vite extracts lazy-route CSS separately. Include it for readable pre-JS content.
  const { readdir } = await import("node:fs/promises");
  const routeCss = (await readdir("dist/assets")).filter(name => /^(Website|Assessment)-.*\.css$/.test(name));
  for (const page of renderPublicPages()) {
    const canonical = `https://wonderworkflow.com${page.path}`;
    let html = template.replace('<div id="root"></div>', `<div id="root">${page.html}</div>`)
      .replace(/<noscript>[\s\S]*?<\/noscript>/, "")
      .replace(/<title>.*?<\/title>/, `<title>${escape(page.metadata[0])} | Wonder &amp; Workflow</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${escape(page.metadata[1])}">`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/?\s*>/, `<meta property="og:title" content="${escape(page.metadata[0])} | Wonder &amp; Workflow">`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/?\s*>/, `<meta property="og:description" content="${escape(page.metadata[1])}">`)
      .replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/, `<meta property="og:url" content="${canonical}">`)
      .replace("</head>", `<link rel="canonical" href="${canonical}">${routeCss.map(name => `<link rel="stylesheet" href="/assets/${name}">`).join("")}</head>`);
    const directory = path.join("dist", page.path);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "index.html"), html);
  }
  console.log("Prerendered public business and policy pages.");
} finally { await server.close(); }
