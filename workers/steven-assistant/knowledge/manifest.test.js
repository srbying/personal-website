import assert from "node:assert/strict";
import { lstat, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { loadManifest, saveManifest } from "./manifest.js";

const manifest = {
  indexName: "test-index",
  embeddingModel: "@cf/test/embedding-model",
  embeddingDimensions: 3,
  chunks: [{ id: "role:0001", hash: "a".repeat(64) }]
};

async function inTempDirectory(run) {
  const directory = await mkdtemp(join(tmpdir(), "knowledge-manifest-test-"));
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("stores only sync metadata atomically outside repository", async () => {
  await inTempDirectory(async (root) => {
    await saveManifest({ knowledgeRoot: root, repositoryRoot: process.cwd(), manifest });
    assert.deepEqual(await loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), manifest);
    const stored = await readFile(join(root, ".sync", "manifest.json"), "utf8");
    assert.equal(stored.includes("test-only factual content"), false);
    assert.equal((await lstat(join(root, ".sync", "manifest.json"))).isFile(), true);
  });
});

test("missing manifest means first sync; malformed or symlinked state is rejected", async () => {
  await inTempDirectory(async (root) => {
    assert.equal(await loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), null);
    await mkdir(join(root, ".sync"));
    await symlink(join(root, ".sync", "target.json"), join(root, ".sync", "manifest.json"));
    await assert.rejects(
      loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }),
      /symlink/
    );
  });
});

test("never reads or writes manifest inside website repository", async () => {
  await inTempDirectory(async (repo) => {
    await mkdir(join(repo, "knowledge"));
    await assert.rejects(
      saveManifest({ knowledgeRoot: join(repo, "knowledge"), repositoryRoot: repo, manifest }),
      /outside the website repository/
    );
    await assert.rejects(
      loadManifest({ knowledgeRoot: join(repo, "knowledge"), repositoryRoot: repo }),
      /outside the website repository/
    );
  });
});


test("rejects empty or content-bearing manifest data", async () => {
  await inTempDirectory(async (root) => {
    await mkdir(join(root, ".sync"));
    await writeFile(join(root, ".sync", "manifest.json"), JSON.stringify({ ...manifest, chunks: [] }));
    await assert.rejects(loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), /invalid/);
    await writeFile(join(root, ".sync", "manifest.json"), JSON.stringify({ ...manifest, sourceText: "must not be persisted" }));
    await assert.rejects(loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), /invalid/);
    await writeFile(join(root, ".sync", "manifest.json"), JSON.stringify({
      ...manifest, chunks: [{ ...manifest.chunks[0], text: "must not be persisted" }]
    }));
    await assert.rejects(loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), /invalid/);
  });
});


test("rejects vector IDs outside the stable positive ordinal format", async () => {
  await inTempDirectory(async (root) => {
    await saveManifest({ knowledgeRoot: root, repositoryRoot: process.cwd(), manifest });
    await writeFile(join(root, ".sync", "manifest.json"), JSON.stringify({
      ...manifest, chunks: [{ id: "role:0000", hash: "a".repeat(64) }]
    }));
    await assert.rejects(loadManifest({ knowledgeRoot: root, repositoryRoot: process.cwd() }), /invalid/);
  });
});
