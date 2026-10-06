// These are safety ceilings, separate from the lower runtime settings in .dev.vars.
const HARD_RESOURCE_CEILINGS = Object.freeze({
  embeddingDimensions: { min: 1, max: 4096 },
  vectorTopK: { min: 1, max: 12 },
  maxMessages: { min: 1, max: 16 },
  maxMessageLength: { min: 1, max: 4000 },
  maxTotalMessageLength: { min: 1, max: 16000 },
  maxBodyBytes: { min: 1, max: 65536 }
});

function readRequiredString(env, key, maxLength = 200) {
  const value = env[key];
  if (typeof value !== "string" || !value.trim() || value.length > maxLength || value !== value.trim()) {
    throw new Error("Invalid worker configuration");
  }
  return value;
}

function readInteger(env, key, { min, max }) {
  const value = readRequiredString(env, key, 12);
  if (!/^\d+$/.test(value)) throw new Error("Invalid worker configuration");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error("Invalid worker configuration");
  }
  return parsed;
}

function readThreshold(env) {
  const value = readRequiredString(env, "RELEVANCE_THRESHOLD", 16);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error("Invalid worker configuration");
  }
  return parsed;
}

function readAllowedOrigins(env) {
  let values;
  try {
    values = JSON.parse(readRequiredString(env, "ALLOWED_ORIGINS_JSON", 2048));
  } catch {
    throw new Error("Invalid worker configuration");
  }
  if (!Array.isArray(values) || values.length === 0 || values.length > 16) {
    throw new Error("Invalid worker configuration");
  }

  const origins = new Set();
  for (const value of values) {
    if (typeof value !== "string" || !value || value !== value.trim()) {
      throw new Error("Invalid worker configuration");
    }
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error("Invalid worker configuration");
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== value ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error("Invalid worker configuration");
    }
    origins.add(value);
  }
  if (origins.size !== values.length) throw new Error("Invalid worker configuration");
  return origins;
}

export function loadWorkerConfig(env) {
  const embeddingModel = readRequiredString(env, "EMBEDDING_MODEL", 160);
  if (!/^@cf\/[\w./-]+$/.test(embeddingModel)) {
    throw new Error("Invalid worker configuration");
  }

  const config = {
    embeddingModel,
    embeddingDimensions: readInteger(env, "EMBEDDING_DIMENSIONS", HARD_RESOURCE_CEILINGS.embeddingDimensions),
    vectorTopK: readInteger(env, "VECTOR_TOP_K", HARD_RESOURCE_CEILINGS.vectorTopK),
    maxMessages: readInteger(env, "MAX_MESSAGES", HARD_RESOURCE_CEILINGS.maxMessages),
    maxMessageLength: readInteger(env, "MAX_MESSAGE_LENGTH", HARD_RESOURCE_CEILINGS.maxMessageLength),
    maxTotalMessageLength: readInteger(env, "MAX_TOTAL_MESSAGE_LENGTH", HARD_RESOURCE_CEILINGS.maxTotalMessageLength),
    maxBodyBytes: readInteger(env, "MAX_BODY_BYTES", HARD_RESOURCE_CEILINGS.maxBodyBytes),
    relevanceThreshold: readThreshold(env),
    allowedOrigins: readAllowedOrigins(env)
  };

  if (config.maxTotalMessageLength > config.maxMessages * config.maxMessageLength) {
    throw new Error("Invalid worker configuration");
  }
  if (config.maxBodyBytes < config.maxTotalMessageLength * 3 + config.maxMessages * 64 + 128) {
    throw new Error("Invalid worker configuration");
  }

  return Object.freeze(config);
}
