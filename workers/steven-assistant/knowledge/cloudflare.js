export function getEmbedding(result, dimensions) {
  const vector = result?.data?.[0];
  if (!Number.isSafeInteger(dimensions) || dimensions < 1 || !Array.isArray(vector) ||
      vector.length !== dimensions || !vector.every(Number.isFinite)) {
    throw new Error(`The embedding model must return ${dimensions} finite numbers.`);
  }
  return vector;
}

export function createCloudflareAdapters({ config, getEnvironment }) {
  if (!config || typeof getEnvironment !== "function") {
    throw new Error("Cloudflare adapters need a validated config and lazy environment provider.");
  }
  let checkedIndex;
  const index = async () => {
    if (!checkedIndex) {
      checkedIndex = Promise.resolve(getEnvironment()).then(async (env) => {
        if (!env?.AI || !env?.KNOWLEDGE) throw new Error("Cloudflare AI and Vectorize bindings are required.");
        const description = await env.KNOWLEDGE.describe();
        if ((typeof description?.name === "string" && description.name !== config.indexName) ||
            description?.dimensions !== config.embeddingDimensions) {
          throw new Error("The Vectorize index dimensions do not match the configured embedding dimensions.");
        }
        return env;
      }).catch((error) => {
        checkedIndex = null;
        throw error;
      });
    }
    return checkedIndex;
  };

  const embeddings = Object.freeze({
    async embed(text) {
      const env = await index();
      return getEmbedding(await env.AI.run(config.embeddingModel, { text: [text] }), config.embeddingDimensions);
    }
  });
  const vectorStore = Object.freeze({
    async assertCompatible() {
      await index();
    },
    async upsert(vectors) {
      const env = await index();
      return env.KNOWLEDGE.upsert(vectors);
    },
    async deleteByIds(ids) {
      const env = await index();
      return env.KNOWLEDGE.deleteByIds(ids);
    },
    async getByIds(ids) {
      const env = await index();
      return env.KNOWLEDGE.getByIds(ids);
    },
    async query(vector, options) {
      const env = await index();
      return env.KNOWLEDGE.query(vector, options);
    }
  });
  return { embeddings, vectorStore };
}
