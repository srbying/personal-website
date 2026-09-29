import { createInterface } from "node:readline/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCloudflareAdapters } from "./knowledge/cloudflare.js";
import { loadKnowledgeConfig } from "./knowledge/config.js";
import { runKnowledgeCommand } from "./knowledge/cli.js";
import { loadManifest, saveManifest } from "./knowledge/manifest.js";
import { loadApprovedSource } from "./knowledge/source.js";
import { createKnowledgeSyncService } from "./knowledge/service.js";

const directory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(directory, "../..");
const DEFAULT_KNOWLEDGE_ROOT = join(homedir(), "Documents/personal-website-knowledge");

async function run() {
  const [command, ...args] = process.argv.slice(2);
  const question = command === "query" ? args.join(" ") : undefined;
  if (command !== "query" && args.length) {
    throw new Error(`Command ${command} does not accept additional arguments.`);
  }
  const config = loadKnowledgeConfig(process.env);
  const knowledgeRoot = process.env.KNOWLEDGE_DIR || DEFAULT_KNOWLEDGE_ROOT;
  let proxy;
  try {
    const getEnvironment = async () => {
      if (!proxy) {
        const { getPlatformProxy } = await import("wrangler");
        proxy = await getPlatformProxy({
          configPath: join(directory, "wrangler.jsonc"),
          persist: false,
          remoteBindings: true
        });
      }
      return proxy.env;
    };
    const adapters = createCloudflareAdapters({ config, getEnvironment });
    const service = createKnowledgeSyncService({
      source: {
        load: () => loadApprovedSource({ knowledgeRoot, repositoryRoot, maxChunkChars: 1000 })
      },
      manifest: {
        read: () => loadManifest({ knowledgeRoot, repositoryRoot }),
        write: (manifest) => saveManifest({ knowledgeRoot, repositoryRoot, manifest })
      },
      ...adapters,
      config
    });

    if (command === "sync" || command === "rebuild") {
      const input = createInterface({ input: process.stdin, output: process.stdout });
      try {
        const prompt = async (message) => input.question(message);
        await runKnowledgeCommand(command, { service, prompt, write: console.log, question });
      } finally {
        input.close();
      }
    } else {
      await runKnowledgeCommand(command, { service, write: console.log, question });
    }
  } finally {
    await proxy?.dispose();
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
