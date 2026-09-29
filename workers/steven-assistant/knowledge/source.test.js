import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadApprovedSource } from "./source.js";

const approvedNote = (id = "role", status = "approved") =>
  `---\nid: ${id}\nstatus: ${status}\napproved_on: 2026-09-28\n---\n# Test note\n\nA test-only factual sentence.\n`;

async function inTempDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), "knowledge-source-test-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("loads Markdown only from approved and ignores drafts and originals", async () => {
  await inTempDirectory(async (root) => {
    await mkdir(join(root, "approved", "nested"), { recursive: true });
    await mkdir(join(root, "drafts"));
    await mkdir(join(root, "originals"));
    await writeFile(join(root, "approved", "nested", "role.md"), approvedNote());
    await writeFile(join(root, "drafts", "draft.md"), "not approved Markdown");
    await writeFile(join(root, "originals", "resume.md"), "never read");

    const source = await loadApprovedSource({
      knowledgeRoot: root,
      repositoryRoot: process.cwd()
    });
    assert.deepEqual(source.notes.map(({ id }) => id), ["role"]);
    assert.equal(source.chunks.length, 1);
    assert.equal(source.chunks[0].noteId, "role");
  });
});

test("missing, empty, or invalid approved directories fail safely", async () => {
  await inTempDirectory(async (root) => {
    await assert.rejects(
      loadApprovedSource({ knowledgeRoot: join(root, "missing"), repositoryRoot: process.cwd() }),
      /source directory/
    );
    await mkdir(join(root, "approved"));
    await assert.rejects(
      loadApprovedSource({ knowledgeRoot: root, repositoryRoot: process.cwd() }),
      /no approved Markdown/
    );
    await writeFile(join(root, "approved", "draft.md"), approvedNote("draft", "draft"));
    await assert.rejects(
      loadApprovedSource({ knowledgeRoot: root, repositoryRoot: process.cwd() }),
      /approved/
    );
  });
});

test("rejects duplicate IDs, symlink entries, and roots inside repository", async () => {
  await inTempDirectory(async (root) => {
    await mkdir(join(root, "approved"));
    await writeFile(join(root, "approved", "one.md"), approvedNote("duplicate"));
    await writeFile(join(root, "approved", "two.md"), approvedNote("duplicate"));
    await assert.rejects(
      loadApprovedSource({ knowledgeRoot: root, repositoryRoot: process.cwd() }),
      /duplicate/
    );

    await rm(join(root, "approved", "two.md"));
    await symlink(join(root, "approved", "one.md"), join(root, "approved", "linked.md"));
    await assert.rejects(
      loadApprovedSource({ knowledgeRoot: root, repositoryRoot: process.cwd() }),
      /symlink/
    );

    const nestedRepositoryRoot = join(root, "repository");
    await mkdir(join(nestedRepositoryRoot, "knowledge", "approved"), { recursive: true });
    await writeFile(join(nestedRepositoryRoot, "knowledge", "approved", "role.md"), approvedNote());
    await assert.rejects(
      loadApprovedSource({
        knowledgeRoot: join(nestedRepositoryRoot, "knowledge"),
        repositoryRoot: nestedRepositoryRoot
      }),
      /outside the website repository/
    );
  });
});
