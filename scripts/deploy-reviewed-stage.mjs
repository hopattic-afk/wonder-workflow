import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import os from "node:os";
import { verifyDeployment } from "./stage-deployment.mjs";

// Supply the short-lived Netlify connector proxy through stdin, never a saved file.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
console.log("Waiting for the approved site and verified staging directory.");
const input = createInterface({ input: process.stdin });
for await (const line of input) {
  input.close();
  try {
    const { siteId, proxyPath, directory } = JSON.parse(line);
    if (siteId !== "b5ad4440-c287-4446-9b46-fb7226035d54") throw new Error("Wrong site.");
    const proxy = new URL(proxyPath);
    if (proxy.origin !== "https://netlify-mcp.netlify.app" || !proxy.pathname.startsWith("/proxy/"))
      throw new Error("Unexpected connector proxy.");
    if (existsSync(path.join(os.homedir(), "Desktop/netlify/netlify-mcp/log.txt")))
      throw new Error("Provider diagnostic logging must be disabled.");
    console.log(JSON.stringify(await verifyDeployment(directory)));
    const child = spawn(process.execPath, [
      path.join(root, ".netlify/tools/mcp-inspect/package/dist/netlify-mcp.js"),
      "--site-id", siteId, "--proxy-path", proxyPath,
    ], { cwd: directory, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    // Do not print raw provider diagnostics: errors may contain the signed proxy.
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    child.on("error", () => { console.error("Deployment helper could not start."); process.exitCode = 1; });
    child.on("close", code => {
      const safeUrls = [...new Set(output.match(/https:\/\/[a-zA-Z0-9-]+\.netlify\.app\/?/g) || [])]
        .filter(url => !url.startsWith("https://netlify-mcp.netlify.app"));
      console.log(JSON.stringify({ helperExitCode: code, siteUrls: safeUrls,
        deployIds: [...new Set([...output.matchAll(/"deployId"\s*:\s*"([a-f0-9]{24})"/g)].map(match => match[1]))],
        requiresIndependentDeployVerification: true }));
      process.exitCode = code ?? 1;
    });
  } catch {
    console.error("Deployment input or stage validation failed. No raw credentials printed.");
    process.exitCode = 1;
  }
  break;
}
