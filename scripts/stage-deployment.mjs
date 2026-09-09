import { createHash, randomUUID } from "node:crypto";
import { copyFile, lstat, mkdir, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// @netlify/mcp 1.15.1 uploads cwd and does not honor .gitignore.
// Add required source files explicitly; never widen this to copy the repository.
export const DEPLOYMENT_FILES = Object.freeze([
  "package.json", "package-lock.json", "index.html", "netlify.toml",
  "tsconfig.json", "vite.config.ts", "public/favicon.svg",
  "scripts/prerender.mjs", "scripts/prerender-entry.tsx",
  "public/brand/emblem.png", "public/brand/logo.png",
  "public/brand/logo-on-black.png", "public/brand/launch.mp4",
  "public/robots.txt", "public/sitemap.xml",
  "netlify/functions/bridge.ts",
  "server/bridge.ts", "server/config.ts", "server/ghl.ts",
  "server/crmSync.ts",
  "server/publicWebsite.ts", "server/storage.ts",
  "src/App.tsx", "src/main.tsx", "src/useStore.ts", "src/useMeetingInbox.ts",
  "src/site/Website.tsx", "src/site/website.css", "src/site/campaign.ts",
  "src/styles/app.css", "src/styles/documents.css",
  "src/components/BookingImport.tsx", "src/components/Form.tsx",
  "src/components/MeetingPrep.tsx", "src/components/Timer.tsx",
  "src/domain/assessment.ts", "src/domain/calculations.ts",
  "src/domain/constants.ts", "src/domain/defaults.ts", "src/domain/documents.ts",
  "src/domain/intake.ts", "src/domain/intakeSchema.ts", "src/domain/meetingIdentity.ts",
  "src/domain/storage.ts", "src/domain/types.ts", "src/domain/validation.ts",
  "src/pages/Assessment.tsx", "src/pages/assessment.css", "src/pages/Calculator.tsx",
  "src/pages/Dashboard.tsx", "src/pages/Documents.tsx", "src/pages/Meetings.tsx",
  "src/pages/Settings.tsx", "src/pages/Worksheet.tsx",
  "docs/examples/prepared-meeting.example.json",
].sort());

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isInside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
};

async function regularPath(root, relative) {
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error(`Refusing linked path: ${relative}`);
  }
  const resolved = await realpath(current);
  if (!isInside(root, resolved) || !(await lstat(current)).isFile())
    throw new Error(`Expected regular file inside repository: ${relative}`);
  return current;
}

async function listFiles(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Refusing linked staging entry: ${relative}`);
    if (entry.isDirectory()) result.push(...await listFiles(path.join(directory, entry.name), `${relative}/`));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unexpected staging entry: ${relative}`);
  }
  return result.sort();
}

export async function verifyDeployment(directory, root = repository) {
  root = await realpath(root);
  const stagingRoot = path.join(root, ".netlify", "staging");
  const requested = path.resolve(directory);
  if (!isInside(stagingRoot, requested)) throw new Error("Staging must be inside .netlify/staging.");
  const resolved = await realpath(requested);
  if (resolved !== requested || !isInside(stagingRoot, resolved)) throw new Error("Staging path must not be a link.");
  const actual = await listFiles(resolved);
  if (JSON.stringify(actual) !== JSON.stringify(DEPLOYMENT_FILES))
    throw new Error("Staging file list differs from the explicit allowlist; create a fresh stage.");
  let bytes = 0;
  const hashes = [];
  for (const relative of DEPLOYMENT_FILES) {
    const source = await readFile(await regularPath(root, relative));
    const staged = await readFile(await regularPath(resolved, relative));
    if (!source.equals(staged)) throw new Error(`Staged file differs from current source: ${relative}`);
    bytes += staged.length;
    hashes.push(`${relative}:${digest(staged)}`);
  }
  return { directory: resolved, files: actual.length, bytes, sha256: digest(hashes.join("\n")) };
}

export async function stageDeployment(root = repository) {
  root = await realpath(root);
  // Verify all sources before creating an uploadable directory.
  const sources = await Promise.all(DEPLOYMENT_FILES.map((relative) => regularPath(root, relative)));
  for (const folder of [".netlify", ".netlify/staging"]) {
    const full = path.join(root, folder);
    await mkdir(full, { recursive: true });
    if ((await lstat(full)).isSymbolicLink() || await realpath(full) !== full)
      throw new Error("Refusing linked staging parent.");
  }
  const destination = path.join(root, ".netlify", "staging", `release-${randomUUID()}`);
  await mkdir(destination);
  for (let index = 0; index < DEPLOYMENT_FILES.length; index++) {
    const target = path.join(destination, DEPLOYMENT_FILES[index]);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(sources[index], target);
  }
  return verifyDeployment(destination, root);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && !(args.length === 2 && args[0] === "--verify"))
      throw new Error("Usage: node scripts/stage-deployment.mjs [--verify <staging-directory>]");
    const result = args.length ? await verifyDeployment(args[1]) : await stageDeployment();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
