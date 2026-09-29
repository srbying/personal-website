# Maintaining your chatbot's knowledge

Status: the external knowledge directory exists and the first approved note has been embedded, uploaded, and retrieved successfully. A one-note learning script is available. A local homepage chat and Worker answer prototype now query approved notes and include a missing-evidence response, but that flow has not yet been manually exercised. Full-directory chunking, preview, synchronization, removals, and rebuild tooling are not implemented yet. The prototype does not store transcripts or send the agreed daily email.

## Where your files will live

You will maintain and sync knowledge from this Mac only. Use this Mac for the setup and update steps; the live chatbot will use the hosted database and will not require your Mac to stay on.

Created source directory, outside the website repository:

```text
/Users/stevenbyington/Documents/personal-website-knowledge/
├── originals/
├── drafts/
├── approved/
└── .sync/
```

- `originals`: source documents such as resume drafts and interview preparation. Never indexed directly.
- `drafts`: Markdown notes being prepared or reviewed. Not eligible for indexing.
- `approved`: only the notes you have explicitly reviewed for use in public chatbot answers.
- `.sync`: local bookkeeping for the indexing tool. Not a place to author content.

The website code remains at `/Users/stevenbyington/Documents/personal-website/`. This guide and the chatbot plan are local, Git-ignored files in that checkout. Knowledge files, raw documents, credentials, and content exports must stay off GitHub. Git exclusions also cover the previously proposed in-repository knowledge location, but the actual source directory will be outside the checkout.

Content approved for the chatbot can appear in its answers. Keeping the original Markdown off GitHub does not make the indexed information confidential: approved text will be sent to the vector database and the AI service used to answer questions.

## First note: working retrieval demonstration

The approved note is `/Users/stevenbyington/Documents/personal-website-knowledge/approved/professional-role.md`. Steven explicitly approved its sentence: "Steven Byington is a software engineering manager."

The note includes `id: professional-role`, `status: approved`, and `approved_on: 2026-09-28` in Markdown frontmatter. The demo reads only this one note, rejects drafts, requires its source directory outside the repository, and limits it to 1,000 characters. It does not scan other files or remove vectors.

Run from `/Users/stevenbyington/Documents/personal-website`:

```sh
# Inspect the single chunk locally; makes no Cloudflare request.
npm run knowledge:demo -- preview

# Generate its embedding and insert or replace its stable vector ID.
npm run knowledge:demo -- index

# Search using the meaning of a question.
npm run knowledge:demo -- query "What does Steven do professionally?"
```

All three commands have been exercised. The index upload was accepted, but the script's initial 27-second polling window expired before it observed the new vector in search. A subsequent query succeeded and returned the exact approved sentence with ID `professional-role:0001` and similarity score `0.6565187`. The score measures similarity; it is not a probability of correctness. Upload acceptance and search visibility are separate states.

Cloudflare resources used:

- Vectorize index: `steven-knowledge`, 768 dimensions, cosine similarity.
- Embedding model: `@cf/baai/bge-base-en-v1.5` through the `AI` binding.
- Stored vector metadata: approved chunk text, content hash, and embedding model. Full source Markdown and local paths are not uploaded.
- `KNOWLEDGE` is the Worker binding that accesses the index.

`index` and `query` use hosted Cloudflare resources even though the script runs on this Mac. They consume the services' free allowances. No paid plan was enabled. The account's billing plan has not been independently inspected. The vector index was created successfully without an upgrade prompt.

If the upload is accepted but the visibility check times out, allow indexing to finish and run the query command before uploading again. Repeating `index` uses the same vector ID and replaces that one chunk; it does not create another copy. The full sync tool will need a separate verification/retry path that does not regenerate embeddings unnecessarily.

These results demonstrate retrieval only. The Worker now asks a text model to assess whether retrieved notes answer the question, but this step is unverified and a model instruction is not a guarantee. With only one indexed sentence, an unrelated question can still return that sentence as its nearest match. Retrieval alone cannot determine whether there is enough evidence to answer a question. Before production, add approved material, exercise the chat, and check that unsupported, misleading, and negative-fit questions are handled safely.

The private [authoring questionnaire](./chatbot-questionnaire.md) helps prepare additional notes. It and any unanswered prompts must never be indexed.

## How to add a note

1. Create a Markdown file in `drafts`, using a descriptive name such as `leadership-feedback.md` or `aeris-project.md`.
2. Write about one coherent topic. Use a clear title and headings, short factual paragraphs, and concrete examples.
3. Include only true details. Leave out unavailable metrics or outcomes rather than estimating them.
4. Remove confidential work information and personal details you do not want visitors to receive.
5. Review the completed note and move the approved version to `approved`. The final tooling will document any additional approval metadata it requires.
6. Preview and apply a sync using the tested instructions that will be added below.
7. Ask the chatbot a question that should use the new note and check its answer against the facts you provided.

For an interview story, use this outline while drafting. Fill it with your own facts before approval:

```markdown
# A descriptive story title

## Situation
What happened and why it mattered.

## My role
What I was responsible for and what belonged to others.

## My actions
What I actually did and why.

## Outcome
What happened, including verified results where available.

## What I learned
What I learned or changed afterward.
```

## How syncing will work

The local indexing tool will read only approved notes, divide them into meaningful chunks, generate embeddings, and store the chunk text, vectors, and identifiers in the hosted database. Your source Markdown remains on your computer. After indexing, the deployed chatbot uses the hosted database and does not depend on your computer staying on.

The final guide must include tested commands for each operation:

| Operation | Expected result | Current status |
| --- | --- | --- |
| First-time setup | Configure the source directory and private credentials | External folder, Wrangler login, and one-note demo complete; full sync configuration pending |
| Validate | Identify malformed or ineligible notes without publishing | Not implemented |
| Preview | Show additions, edits, and removals without changing the database | Not implemented |
| Sync | Apply the reviewed changes to the chosen database | Not implemented |
| Verify | Confirm counts and ask representative questions | First-note semantic retrieval verified; full sync verification pending |
| Rebuild | Restore the index from the approved notes | Not implemented |

Preview output should make the target database and deletion counts clear. A missing or unexpectedly empty source folder must not silently wipe the index. The implementation must handle partial failures without presenting an incomplete upload as a successful sync.

## How to edit, correct, or remove information

- For an edit, review the revised note and sync it. The tool must replace outdated chunks so contradictory versions do not remain searchable.
- For a removal, remove the note from the approved collection and use the documented preview-and-sync process to remove its indexed content.
- If an answer is wrong, inspect the approved source first. Correct inaccurate notes; if the notes are already correct, investigate retrieval or answer generation instead of adding invented facts.
- Changes in local files do not change the live chatbot until sync succeeds.

## Verification and troubleshooting

After each sync, check a question covered by the changed material and a question for which no answer is supplied. The chatbot should use the new information accurately and acknowledge the missing information.

The completed guide will cover missing credentials, unreadable folders, rejected notes, free-service limits, partial uploads, stale answers, and how to retry safely. It will also explain how to verify that no content files have become tracked by Git.

## Backup and recovery

Keep a private backup of originals and approved notes using your chosen backup method. They cannot be recovered from GitHub because they are deliberately excluded. The vector database is a rebuildable search index; the readable notes remain the authoritative source.

Before production release, perform the documented add, edit, remove, retry, and rebuild procedures end to end and replace the pending entries above with the exact working commands.
