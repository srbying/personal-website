import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import siteConfig from "../src/data/siteConfig.json" with { type: "json" };

const root = process.cwd();
const resumePdfPublicFile = `public${siteConfig.resumePdfRoute}`;

const requiredPublicAssets = [
  "public/assets/brand/logo-system.png",
  "public/assets/brand/steven-byington-wordmark.png",
  "public/assets/brand/sb-icon.png",
  "public/favicon.png",
  "public/assets/brand/apple-touch-icon.png",
  "public/assets/brand/logo-lockup.png",
  "public/assets/brand/logo-lockup-cream.png",
  "public/assets/brand/open-graph.svg",
  "public/assets/brand/open-graph.png",
  "public/assets/hero/hero-landscape.webp",
  "public/assets/hero/hero-landscape.png",
  resumePdfPublicFile,
  "public/assets/projects/aeris/chat-response.png",
  "public/assets/projects/aeris/chat-loading.png",
  "public/assets/projects/aeris/activity-history.png",
  "public/assets/projects/aeris/trend-evidence.png",
  "public/assets/projects/aeris/import-csv.png",
  "public/assets/projects/soilos/scenario-comparison.png",
  "public/assets/projects/soilos/calculator.png",
  "public/assets/projects/soilos/calendar-task-detail.png",
  "public/assets/projects/soilos/calendar-month.png"
];

const requiredManifestSnippets = [
  siteConfig.resumePdfRoute,
  "https://aeris-lac.vercel.app",
  "https://github.com/srbying/aeris",
  "https://soil-os.vercel.app",
  "Repository exists but is private",
  "no visible people, animals, buildings, text, or literal logo recreation",
  "precise locations, API keys, auth details"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const assetPath of requiredPublicAssets) {
  assert(existsSync(path.join(root, assetPath)), `Missing launch asset: ${assetPath}`);
}

const manifest = await readFile(path.join(root, "src/data/launchAssets.ts"), "utf8");
const docs = await readFile(path.join(root, "docs/launch-assets.md"), "utf8");

for (const snippet of requiredManifestSnippets) {
  assert(
    manifest.includes(snippet) || docs.includes(snippet),
    `Missing launch asset confirmation: ${snippet}`
  );
}

assert(!manifest.includes('reviewStatus: "pending"'), "Expected no pending launch assets");
assert(
  manifest.includes("Standard resume PDF supplied by Steven"),
  "Expected the resume PDF to be marked supplied and approved"
);
assert(
  docs.includes("city-level location text"),
  "Expected Soilos location-bearing screenshot to be documented as withheld"
);

console.log("Issue #3 launch asset checks passed.");
