const INDEX_NAME = "steven-knowledge";

function requiredString(env, name) {
  const value = env[name];
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > 160) {
    throw new Error(`Knowledge configuration is missing or invalid: ${name}.`);
  }
  return value;
}

function positiveInteger(env, name, maximum) {
  const value = requiredString(env, name);
  if (!/^\d+$/.test(value)) throw new Error(`Knowledge configuration is invalid: ${name}.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`Knowledge configuration is invalid: ${name}.`);
  }
  return parsed;
}

export function loadKnowledgeConfig(env) {
  const embeddingModel = requiredString(env, "EMBEDDING_MODEL");
  if (!/^@cf\/[\w./-]+$/.test(embeddingModel)) {
    throw new Error("Knowledge configuration is invalid: EMBEDDING_MODEL.");
  }
  return Object.freeze({
    indexName: INDEX_NAME,
    embeddingModel,
    embeddingDimensions: positiveInteger(env, "EMBEDDING_DIMENSIONS", 4096),
    vectorTopK: positiveInteger(env, "VECTOR_TOP_K", 50)
  });
}
