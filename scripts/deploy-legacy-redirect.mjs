import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import { readFile, readdir, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteId = "1a6e0289-a029-4eee-8dfb-5f822de14bb4";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedDirectory = await realpath(path.join(root, "compat", "legacy-url"));
const expectedFiles = ["index.html", "netlify.toml"];

const entries = await readdir(expectedDirectory, { withFileTypes: true });
if (entries.some((entry) => !entry.isFile()))
  throw new Error("Legacy redirect directory contains a non-regular entry.");
const actualFiles = entries.map((entry) => entry.name).sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles))
  throw new Error("Legacy redirect directory differs from the two-file allowlist.");

const digest = createHash("sha256");
for (const file of expectedFiles) digest.update(await readFile(path.join(expectedDirectory, file)));
console.log(JSON.stringify({ files: expectedFiles.length, sha256: digest.digest("hex") }));
if (existsSync(path.join(os.homedir(), "Desktop", "netlify", "netlify-mcp", "log.txt")))
  throw new Error("Provider diagnostic logging must be disabled.");

const input = createInterface({ input: process.stdin });
for await (const line of input) {
  input.close();
  try {
    const { proxyPath } = JSON.parse(line);
    const proxy = new URL(proxyPath);
    if (proxy.origin !== "https://netlify-mcp.netlify.app" || !proxy.pathname.startsWith("/proxy/"))
      throw new Error("Unexpected connector proxy.");
    const child = spawn(process.execPath, [
      path.join(root, ".netlify", "tools", "mcp-inspect", "package", "dist", "netlify-mcp.js"),
      "--site-id", siteId,
      "--proxy-path", proxyPath,
    ], { cwd: expectedDirectory, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", () => {
      console.error("Legacy redirect deployment helper could not start.");
      process.exitCode = 1;
    });
    child.on("close", (code) => {
      console.log(JSON.stringify({
        helperExitCode: code,
        deployIds: [...new Set([...output.matchAll(/"deployId"\s*:\s*"([a-f0-9]{24})"/g)].map((match) => match[1]))],
      }));
      process.exitCode = code ?? 1;
    });
  } catch {
    console.error("Legacy redirect deployment input failed.");
    process.exitCode = 1;
  }
  break;
}
