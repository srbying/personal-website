import { planSync } from "./planner.js";

const DEFAULT_WAIT_OPTIONS = Object.freeze({
  attempts: 6,
  delays: [1000, 2000, 4000, 8000, 12000],
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
});
const MAX_VECTOR_BATCH = 1000;

function asVectorList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.vectors)) return value.vectors;
  return [];
}

function sameVector(vector, chunk, config) {
  const metadata = vector?.metadata;
  const values = vector?.values;
  const hasVectorValues = (Array.isArray(values) || ArrayBuffer.isView(values)) &&
    values.length === config.embeddingDimensions &&
    Array.from(values).every(Number.isFinite);
  return vector?.id === chunk.id && hasVectorValues &&
    metadata?.hash === chunk.hash && metadata?.text === chunk.text &&
    metadata?.model === config.embeddingModel && metadata?.noteId === chunk.noteId &&
    metadata?.ordinal === chunk.ordinal;
}

function batches(values, size = MAX_VECTOR_BATCH) {
  const result = [];
  for (let offset = 0; offset < values.length; offset += size) result.push(values.slice(offset, offset + size));
  return result;
}

function createManifest(chunks, config) {
  return {
    indexName: config.indexName,
    embeddingModel: config.embeddingModel,
    embeddingDimensions: config.embeddingDimensions,
    chunks: chunks.map(({ id, hash }) => ({ id, hash }))
  };
}

export function createKnowledgeSyncService({ source, manifest, embeddings, vectorStore, config, waitOptions = {} }) {
  if (!source?.load || !manifest?.read || !manifest?.write || !embeddings?.embed ||
      !vectorStore?.upsert || !vectorStore?.deleteByIds || !vectorStore?.getByIds) {
    throw new Error("Knowledge sync requires source, manifest, embedding, and vector-store interfaces.");
  }
  const wait = { ...DEFAULT_WAIT_OPTIONS, ...waitOptions };

  async function loadLocalState() {
    const approved = await source.load();
    if (!approved?.chunks?.length) throw new Error("There is no approved Markdown to sync.");
    const previous = await manifest.read();
    return { approved, previous };
  }

  async function waitForVectors(expected, { absent = false } = {}) {
    if (!expected.length) return [];
    const failures = new Set(expected.map(({ id }) => id));
    for (let attempt = 0; attempt < wait.attempts; attempt += 1) {
      if (attempt > 0) {
        const delay = wait.delays[Math.min(attempt - 1, wait.delays.length - 1)] ?? 12000;
        await wait.sleep(delay);
      }
      failures.clear();
      for (const group of batches(expected)) {
        const records = asVectorList(await vectorStore.getByIds(group.map(({ id }) => id)));
        const found = new Map(records.map((record) => [record.id, record]));
        for (const item of group) {
          const record = found.get(item.id);
          if (absent ? record : !sameVector(record, item, config)) failures.add(item.id);
        }
      }
      if (!failures.size) return [];
    }
    return [...failures];
  }

  async function verifyExpected(expected) {
    const changed = await waitForVectors(expected);
    if (changed.length) {
      throw new Error(`Vectorize did not verify the expected approved chunks: ${changed.join(", ")}`);
    }
  }

  async function upsertChunks(chunks) {
    const vectors = [];
    for (const chunk of chunks) {
      const values = await embeddings.embed(chunk.text);
      if (!Array.isArray(values) || values.length !== config.embeddingDimensions || !values.every(Number.isFinite)) {
        throw new Error(`The embedding model must return ${config.embeddingDimensions} finite numbers.`);
      }
      vectors.push({
        id: chunk.id,
        values,
        metadata: {
          text: chunk.text,
          hash: chunk.hash,
          model: config.embeddingModel,
          noteId: chunk.noteId,
          ordinal: chunk.ordinal
        }
      });
    }
    for (const group of batches(vectors)) await vectorStore.upsert(group);
    await verifyExpected(chunks);
  }

  async function deleteStale(chunks) {
    for (const group of batches(chunks)) {
      await vectorStore.deleteByIds(group.map(({ id }) => id));
      const missing = await waitForVectors(group, { absent: true });
      if (missing.length) {
        throw new Error(`Vectorize did not verify removal of managed chunks: ${missing.join(", ")}`);
      }
    }
  }

  async function prepare(rebuild = false) {
    const { approved, previous } = await loadLocalState();
    return { approved, previous, plan: planSync(approved.chunks, previous, config, { rebuild }) };
  }

  async function apply({ rebuild = false, confirm } = {}) {
    const { approved, plan } = await prepare(rebuild);
    if (typeof confirm !== "function" || await confirm(plan) !== true) return { status: "cancelled", plan };
    await upsertChunks([...plan.additions, ...plan.edits]);
    await deleteStale(plan.removals);
    const next = createManifest(approved.chunks, config);
    await manifest.write(next);
    return { status: rebuild ? "rebuilt" : "synced", plan, manifest: next };
  }

  return Object.freeze({
    async validate() {
      const approved = await source.load();
      if (!approved?.chunks?.length) throw new Error("There is no approved Markdown to sync.");
      return { noteCount: approved.notes?.length ?? 0, chunkCount: approved.chunks.length, notes: approved.notes ?? [] };
    },
    async preview() {
      return (await prepare()).plan;
    },
    sync(options) {
      return apply(options);
    },
    rebuild(options) {
      return apply({ ...options, rebuild: true });
    },
    async verify() {
      const { approved, previous, plan } = await prepare();
      if (!previous) {
        return { ok: false, missing: approved.chunks.map(({ id }) => id), changed: [], stale: [], plan };
      }
      const records = [];
      for (const group of batches(previous.chunks)) {
        records.push(...asVectorList(await vectorStore.getByIds(group.map(({ id }) => id))));
      }
      const found = new Map(records.map((record) => [record.id, record]));
      const desired = new Map(approved.chunks.map((chunk) => [chunk.id, chunk]));
      const missing = [];
      const changed = [];
      const stale = [];
      for (const entry of previous.chunks) {
        const vector = found.get(entry.id);
        const chunk = desired.get(entry.id);
        if (!vector) missing.push(entry.id);
        else if (!chunk) stale.push(entry.id);
        else if (!sameVector(vector, chunk, config)) changed.push(entry.id);
      }
      for (const chunk of approved.chunks) {
        if (!previous.chunks.some(({ id }) => id === chunk.id)) missing.push(chunk.id);
      }
      return { ok: !missing.length && !changed.length && !stale.length &&
        !plan.additions.length && !plan.edits.length && !plan.removals.length,
      missing: [...new Set(missing)], changed: [...new Set(changed)], stale, plan };
    },
    async query(question) {
      if (typeof question !== "string" || !question.trim() || question.length > 300) {
        throw new Error("Supply a question between 1 and 300 characters.");
      }
      if (typeof vectorStore.query !== "function") throw new Error("The vector store does not support read-only query.");
      const vector = await embeddings.embed(question.trim());
      if (!Array.isArray(vector) || vector.length !== config.embeddingDimensions || !vector.every(Number.isFinite)) {
        throw new Error(`The embedding model must return ${config.embeddingDimensions} finite numbers.`);
      }
      return vectorStore.query(vector, { topK: config.vectorTopK ?? 8, returnMetadata: "all" });
    }
  });
}
