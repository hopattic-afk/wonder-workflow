import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEPLOYMENT_FILES, stageDeployment, verifyDeployment } from "./stage-deployment.mjs";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function fixture(t) {
  const parent = path.join(workspace, ".netlify", "stage-tests");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, "case-"));
  t.after(async () => {
    // Only remove this test-created directory after verifying its absolute boundary.
    assert.equal(path.dirname(root), parent);
    assert.ok(path.basename(root).startsWith("case-"));
    await rm(root, { recursive: true, force: true });
  });
  for (const name of DEPLOYMENT_FILES) {
    const destination = path.join(root, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, `fictional test content: ${name}`);
  }
  return root;
}

test("copies only explicit sources, excludes private files and preserves bytes", async (t) => {
  const root = await fixture(t);
  for (const relative of [".env", ".env.local", "docs/private.md", "output/contact.json", ".npm-cache/log.txt"]){
    await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
    await writeFile(path.join(root, relative), "private sentinel");
  }
  const result = await stageDeployment(root);
  assert.equal(result.files, DEPLOYMENT_FILES.length);
  for (const relative of DEPLOYMENT_FILES) {
    assert.equal(await readFile(path.join(result.directory, relative), "utf8"), `fictional test content: ${relative}`);
  }
  assert.deepEqual(await verifyDeployment(result.directory, root), result);
});

test("rejects an extra staged file even when uploader would include it", async (t) => {
  const root = await fixture(t);
  const result = await stageDeployment(root);
  await writeFile(path.join(result.directory, ".env.local"), "private sentinel");
  await assert.rejects(verifyDeployment(result.directory, root), /file list differs/);
});

test("rejects changed source and never overwrites an existing release", async (t) => {
  const root = await fixture(t);
  const first = await stageDeployment(root);
  const second = await stageDeployment(root);
  assert.notEqual(first.directory, second.directory);
  await writeFile(path.join(root, "package.json"), "changed source");
  await assert.rejects(verifyDeployment(first.directory, root), /differs from current source/);
});

test("rejects staging outside the intended directory", async (t) => {
  const root = await fixture(t);
  await assert.rejects(verifyDeployment(root, root), /must be inside/);
});

test("missing required source aborts staging", async (t) => {
  const root = await fixture(t);
  const generatedFixtureFile = path.join(root, "netlify", "functions", "bridge.ts");
  await rm(generatedFixtureFile);
  await assert.rejects(stageDeployment(root), /ENOENT/);
});
