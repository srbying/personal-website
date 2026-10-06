import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkApprovedNote, parseApprovedNote } from "./markdown.js";

const note = (id = "professional-role", body = "A test-only factual sentence.", status = "approved") =>
  `---\nid: ${id}\nstatus: ${status}\napproved_on: 2026-09-28\n---\n# Test note\n\n${body}\n`;

test("requires approved status, stable slug ID, real approval date, title, and body", () => {
  assert.equal(parseApprovedNote(note()).id, "professional-role");
  assert.throws(() => parseApprovedNote(note("role", "Sentence.", "draft")), /approved/);
  assert.throws(() => parseApprovedNote(note("../role")), /id/);
  assert.throws(() => parseApprovedNote(note().replace("2026-09-28", "2026-02-30")), /date/);
  assert.throws(() => parseApprovedNote(note().replace("status: approved\n", "")), /status/);
  assert.throws(() => parseApprovedNote(note("role", "")), /body/);
});

test("chunks preserve headings and Markdown blocks within the configured target", () => {
  const parsed = parseApprovedNote(note(
    "work",
    "## Delivery\n\nFirst short paragraph.\n\n- First list item\n- Second list item\n\n## Outcomes\n\nSecond short paragraph."
  ));
  const chunks = chunkApprovedNote(parsed, 72);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.text.length <= 72));
  assert.ok(chunks.some((chunk) => chunk.text.includes("## Delivery")));
  assert.ok(chunks.some((chunk) => chunk.text.includes("## Outcomes")));
  assert.ok(chunks.some((chunk) => chunk.text.includes("- First list item\n- Second list item")));
});

test("oversized paragraphs split at readable boundaries and repeat active headings", () => {
  const body = "This is a complete sentence with useful test details. ".repeat(8);
  const parsed = parseApprovedNote(note("story", `## Work\n\n${body}`));
  const chunks = chunkApprovedNote(parsed, 64);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.text.length <= 64));
  assert.ok(chunks.every((chunk) => chunk.text.startsWith("# Test note\n## Work")));
  const bodyPieces = chunks.map((chunk) => chunk.text.split("\n\n").at(-1)).join(" ");
  assert.equal(bodyPieces.replace(/\s+/g, " ").trim(), body.trim());
});

test("chunk IDs and text hashes are deterministic and preserve first legacy ID", () => {
  const parsed = parseApprovedNote(note());
  const first = chunkApprovedNote(parsed);
  const retry = chunkApprovedNote(parsed);
  assert.equal(first[0].id, "professional-role:0001");
  assert.deepEqual(first, retry);
  assert.match(first[0].hash, /^[a-f0-9]{64}$/);
  assert.notEqual(
    first[0].hash,
    chunkApprovedNote(parseApprovedNote(note("professional-role", "Changed approved sentence.")))[0].hash
  );
});
