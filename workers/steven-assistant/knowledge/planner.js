import { validateManifestData } from "./manifest-format.js";

function validateManifestIdentity(manifest, config) {
  validateManifestData(manifest);
  if (manifest.indexName !== config.indexName) {
    throw new Error("The knowledge manifest belongs to a different Vectorize index.");
  }
  if (manifest.embeddingDimensions !== config.embeddingDimensions) {
    throw new Error("Embedding dimensions differ from the knowledge manifest; refusing to sync.");
  }
}

function validateChunks(chunks) {
  const ids = new Set();
  for (const chunk of chunks) {
    if (!chunk || typeof chunk.id !== "string" || typeof chunk.noteId !== "string" ||
        !Number.isSafeInteger(chunk.ordinal) || chunk.ordinal < 1 ||
        typeof chunk.text !== "string" || !chunk.text || !/^[a-f0-9]{64}$/.test(chunk.hash) ||
        chunk.id !== `${chunk.noteId}:${String(chunk.ordinal).padStart(4, "0")}` || ids.has(chunk.id)) {
      throw new Error("Approved source contains an invalid or duplicate chunk.");
    }
    ids.add(chunk.id);
  }
}

export function planSync(chunks, manifest, config, { rebuild = false } = {}) {
  if (!config || typeof config.indexName !== "string" || !config.indexName ||
      typeof config.embeddingModel !== "string" || !config.embeddingModel ||
      !Number.isSafeInteger(config.embeddingDimensions) || config.embeddingDimensions < 1) {
    throw new Error("Invalid knowledge sync configuration.");
  }
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error("There is no approved Markdown to sync.");
  }
  validateChunks(chunks);
  if (manifest) validateManifestIdentity(manifest, config);

  const previous = new Map((manifest?.chunks ?? []).map((chunk) => [chunk.id, chunk]));
  const desired = new Map(chunks.map((chunk) => [chunk.id, chunk]));
  const additions = [];
  const edits = [];
  const unchanged = [];
  const removals = [];

  for (const chunk of chunks) {
    const old = previous.get(chunk.id);
    if (!old) additions.push(chunk);
    else if (rebuild || old.hash !== chunk.hash || manifest.embeddingModel !== config.embeddingModel) edits.push(chunk);
    else unchanged.push(chunk);
  }
  if (manifest) {
    for (const chunk of manifest.chunks) {
      if (!desired.has(chunk.id)) removals.push(chunk);
    }
  }

  return Object.freeze({
    indexName: config.indexName,
    embeddingModel: config.embeddingModel,
    embeddingDimensions: config.embeddingDimensions,
    additions,
    edits,
    removals,
    unchanged
  });
}
