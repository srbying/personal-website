const HASH_PATTERN = /^[a-f0-9]{64}$/;
const VECTOR_ID_PATTERN = /^([a-z0-9]+(?:-[a-z0-9]+)*):(\d{4,})$/;
const ROOT_KEYS = "chunks,embeddingDimensions,embeddingModel,indexName";

export function validateManifestData(value) {
  if (!value || Object.keys(value).sort().join(",") !== ROOT_KEYS ||
      typeof value.indexName !== "string" || !value.indexName ||
      typeof value.embeddingModel !== "string" || !value.embeddingModel ||
      !Number.isSafeInteger(value.embeddingDimensions) || value.embeddingDimensions < 1 ||
      !Array.isArray(value.chunks) || value.chunks.length === 0) {
    throw new Error("The knowledge manifest is invalid; refusing to sync.");
  }
  const ids = new Set();
  for (const chunk of value.chunks) {
    const vectorId = typeof chunk?.id === "string" ? chunk.id.match(VECTOR_ID_PATTERN) : null;
    const ordinal = vectorId ? Number(vectorId[2]) : 0;
    if (!chunk || Object.keys(chunk).sort().join(",") !== "hash,id" ||
        !vectorId || !Number.isSafeInteger(ordinal) || ordinal < 1 ||
        String(ordinal).padStart(4, "0") !== vectorId[2] ||
        !HASH_PATTERN.test(chunk.hash) || ids.has(chunk.id)) {
      throw new Error("The knowledge manifest contains invalid or duplicate chunk metadata.");
    }
    ids.add(chunk.id);
  }
  return value;
}
