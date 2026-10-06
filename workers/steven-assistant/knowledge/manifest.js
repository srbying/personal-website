import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { resolveExternalKnowledgeRoot } from "./paths.js";
import { validateManifestData } from "./manifest-format.js";

async function getSyncDirectory(knowledgeRoot, repositoryRoot, { create = false } = {}) {
  const root = await resolveExternalKnowledgeRoot(knowledgeRoot, repositoryRoot);
  const syncDirectory = join(root, ".sync");
  try {
    const info = await lstat(syncDirectory);
    if (info.isSymbolicLink()) throw new Error("The knowledge sync directory must not be a symlink.");
    if (!info.isDirectory()) throw new Error("The knowledge sync path must be a directory.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (!create) return null;
    await mkdir(syncDirectory, { mode: 0o700 });
  }
  return syncDirectory;
}

export async function loadManifest({ knowledgeRoot, repositoryRoot }) {
  const syncDirectory = await getSyncDirectory(knowledgeRoot, repositoryRoot);
  if (!syncDirectory) return null;
  const path = join(syncDirectory, "manifest.json");
  let info;
  try {
    info = await lstat(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (info.isSymbolicLink()) throw new Error("The knowledge manifest must not be a symlink.");
  if (!info.isFile()) throw new Error("The knowledge manifest must be a regular file.");
  let value;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
  } catch {
    throw new Error("The knowledge manifest is unreadable or malformed; refusing to sync.");
  }
  return validateManifestData(value);
}

export async function saveManifest({ knowledgeRoot, repositoryRoot, manifest }) {
  validateManifestData(manifest);
  const root = await resolveExternalKnowledgeRoot(knowledgeRoot, repositoryRoot);
  const syncDirectory = await getSyncDirectory(root, repositoryRoot, { create: true });
  const path = join(syncDirectory, "manifest.json");
  try {
    const current = await lstat(path);
    if (current.isSymbolicLink()) throw new Error("The knowledge manifest must not be a symlink.");
    if (!current.isFile()) throw new Error("The knowledge manifest must be a regular file.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const temporaryPath = join(syncDirectory, `.manifest-${randomUUID()}.tmp`);
  let file;
  try {
    file = await open(temporaryPath, "wx", 0o600);
    await file.writeFile(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await file.sync();
    await file.close();
    file = null;
    await rename(temporaryPath, path);
  } catch (error) {
    if (file) await file.close().catch(() => {});
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}
