import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { loadWorkerConfig } from './src/config.js';

const directory = dirname(fileURLToPath(import.meta.url));
const repository = resolve(directory, '../..');
const indexName = 'steven-knowledge';

// This intentionally handles one approved note. General chunking, removals,
// and full-directory synchronization are later milestones.
export function parseApprovedNote(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n# [^\r\n]+\r?\n+([\s\S]*)$/);
  if (!match) throw new Error('Expected frontmatter, a Markdown title, and the approved text.');
  const metadata = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z_]+): (.+)$/);
    if (!field || metadata.has(field[1])) throw new Error('Invalid or duplicate note metadata.');
    metadata.set(field[1], field[2].trim());
  }
  if (metadata.get('status') !== 'approved') throw new Error('Only approved notes can be indexed.');
  if (metadata.get('id') !== 'professional-role') throw new Error('This demo only handles the professional-role note.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.get('approved_on') ?? '')) {
    throw new Error('An approved_on date is required.');
  }
  const text = match[2].trim();
  if (!text || text.length > 1000) throw new Error('This one-chunk demo requires 1–1000 characters of approved text.');
  return {
    id: `${metadata.get('id')}:0001`,
    text,
    hash: createHash('sha256').update(text).digest('hex'),
  };
}

export async function loadApprovedNote(root) {
  const sourceRoot = await realpath(root);
  if (sourceRoot === repository || sourceRoot.startsWith(`${repository}${sep}`)) {
    throw new Error('Knowledge must live outside the website repository.');
  }
  const approvedDirectory = join(sourceRoot, 'approved');
  if (await realpath(approvedDirectory) !== approvedDirectory) {
    throw new Error('The approved directory must not be a symlink.');
  }
  const path = join(approvedDirectory, 'professional-role.md');
  if (await realpath(path) !== path) throw new Error('The approved note must not be a symlink.');
  return { ...parseApprovedNote(await readFile(path, 'utf8')), path };
}

export function getEmbedding(result, dimensions = Number(process.env.EMBEDDING_DIMENSIONS)) {
  const vector = result?.data?.[0];
  if (!Number.isSafeInteger(dimensions) || dimensions < 1 ||
      !Array.isArray(vector) || vector.length !== dimensions || !vector.every(Number.isFinite)) {
    throw new Error(`The embedding model must return ${dimensions} finite numbers.`);
  }
  return vector;
}

async function run() {
  const [command, question, ...extra] = process.argv.slice(2);
  if (!['preview', 'index', 'query'].includes(command) || extra.length ||
      (command !== 'query' && question !== undefined)) {
    throw new Error('Use: npm run knowledge:demo -- preview | index | query "Your question"');
  }
  if (command === 'query' && (!question?.trim() || question.length > 300)) {
    throw new Error('Supply a question between 1 and 300 characters.');
  }

  const config = loadWorkerConfig(process.env);
  const root = process.env.KNOWLEDGE_DIR ?? join(homedir(), 'Documents/personal-website-knowledge');
  const note = command === 'query' ? null : await loadApprovedNote(root);
  if (command === 'preview') {
    console.log(JSON.stringify({
      operation: 'upsert one chunk',
      index: indexName,
      model: config.embeddingModel,
      dimensions: config.embeddingDimensions,
      ...note
    }, null, 2));
    return;
  }

  // Remote bindings use the existing Wrangler login; no token or private note
  // is embedded in the Worker source, and no public ingestion route exists.
  const { getPlatformProxy } = await import('wrangler');
  const proxy = await getPlatformProxy({
    configPath: join(directory, 'wrangler.jsonc'),
    persist: false,
    remoteBindings: true,
  });
  try {
    const { AI, KNOWLEDGE } = proxy.env;
    const vector = getEmbedding(
      await AI.run(config.embeddingModel, { text: [note?.text ?? question.trim()] }),
      config.embeddingDimensions
    );
    if (command === 'query') {
      const result = await KNOWLEDGE.query(vector, { topK: config.vectorTopK, returnMetadata: 'all' });
      console.log(JSON.stringify({
        question,
        matches: result.matches.map(({ id, score, metadata }) => ({ id, score, text: metadata?.text })),
        note: 'These are retrieved passages, not generated answers. A match or score does not prove the passage answers the question.',
      }, null, 2));
      return;
    }

    const mutation = await KNOWLEDGE.upsert([{
      id: note.id,
      values: vector,
      metadata: { text: note.text, hash: note.hash, model: config.embeddingModel },
    }]);
    console.log(`Submitted one chunk to ${indexName}; checking search visibility.`);
    // Upserts are asynchronous. Check the exact text and hash, so an older
    // version of the same ID cannot be mistaken for a successful update.
    for (const milliseconds of [1000, 2000, 4000, 8000, 12000]) {
      await delay(milliseconds);
      const result = await KNOWLEDGE.query(vector, { topK: config.vectorTopK, returnMetadata: 'all' });
      const match = result.matches.find(item => item.id === note.id &&
        item.metadata?.hash === note.hash && item.metadata?.text === note.text);
      if (match) {
        console.log(JSON.stringify({
          status: 'verified searchable', index: indexName, id: note.id,
          dimensions: vector.length, mutationId: mutation.mutationId, text: match.metadata.text,
        }, null, 2));
        return;
      }
    }
    throw new Error('Upload was accepted, but search visibility is not yet verified. Allow indexing to finish, then run the query command to check retrieval.');
  } finally {
    await proxy.dispose();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
