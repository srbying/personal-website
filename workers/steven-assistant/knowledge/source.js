import { lstat, readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chunkApprovedNote, parseApprovedNote } from "./markdown.js";
import { resolveExternalKnowledgeRoot } from "./paths.js";

async function collectMarkdownFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    const details = await lstat(path);
    if (details.isSymbolicLink()) throw new Error(`Approved source contains a symlink: ${entry.name}`);
    if (details.isDirectory()) {
      files.push(...await collectMarkdownFiles(path, join(relativeDirectory, entry.name)));
    } else if (details.isFile() && extname(entry.name) === ".md") {
      files.push({ path, relativePath: join(relativeDirectory, entry.name) });
    }
  }
  return files;
}

export async function loadApprovedSource({ knowledgeRoot, repositoryRoot, maxChunkChars = 1000 }) {
  const root = await resolveExternalKnowledgeRoot(knowledgeRoot, repositoryRoot);
  const approvedDirectory = join(root, "approved");
  let approvedInfo;
  try {
    approvedInfo = await lstat(approvedDirectory);
  } catch {
    throw new Error("The approved source directory does not exist or cannot be read.");
  }
  if (approvedInfo.isSymbolicLink()) throw new Error("The approved source directory must not be a symlink.");
  if (!approvedInfo.isDirectory()) throw new Error("The approved source path must be a directory.");

  const files = await collectMarkdownFiles(approvedDirectory);
  if (!files.length) throw new Error("There is no approved Markdown to sync.");
  files.sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);

  const notes = [];
  const ids = new Set();
  const chunks = [];
  for (const file of files) {
    const note = parseApprovedNote(await readFile(file.path, "utf8"), file.relativePath);
    if (ids.has(note.id)) throw new Error(`Duplicate approved note id: ${note.id}`);
    ids.add(note.id);
    notes.push({ ...note, sourceName: file.relativePath });
    chunks.push(...chunkApprovedNote(note, maxChunkChars));
  }
  if (!chunks.length) throw new Error("Approved Markdown produced no searchable chunks.");
  return Object.freeze({ notes, chunks });
}
