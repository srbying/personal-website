import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/content.config.ts",
  "src/content/projects/aeris.mdx",
  "src/pages/projects.astro",
  "src/pages/projects/[slug].astro",
  "src/data/projects.ts",
  "src/styles/global.css"
];

const projectIntro =
  "A small set of personal tools and experiments built to solve real problems, explore product ideas, and deepen technical judgment.";

const requiredAerisSections = [
  "Overview",
  "Why I Built It",
  "Product Decisions",
  "Technical Approach",
  "What I Learned",
  "Screenshots",
  "What I'd Do Next"
];

const requiredAerisCopy = [
  "personal fitness analytics tool",
  "speed and fitness progress",
  "trends, comparisons, and progress insights",
  "product thinking",
  "Garmin CSV",
  "Supabase Postgres",
  "OpenAI Responses API",
  "AI-assisted learning"
];

const requiredScreenshots = [
  "/assets/projects/aeris/chat-response.png",
  "/assets/projects/aeris/chat-loading.png",
  "/assets/projects/aeris/activity-history.png",
  "/assets/projects/aeris/trend-evidence.png",
  "/assets/projects/aeris/import-csv.png"
];

const rejectedProjectText = [
  "badge wall",
  "badge-wall",
  "Coming soon",
  "future slice",
  "placeholder"
];

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertInOrder(source, snippets, message) {
  const indexes = snippets.map((snippet) => source.indexOf(snippet));
  assert(indexes.every((index) => index !== -1), message);
  assert(
    indexes.every((index, position) => position === 0 || index > indexes[position - 1]),
    message
  );
}

for (const filePath of requiredFiles) {
  assert(existsSync(path.join(root, filePath)), `Missing required file: ${filePath}`);
}

const [
  packageJsonSource,
  astroConfig,
  contentConfig,
  projectData,
  projectsPage,
  aerisPage,
  aerisContent,
  launchAssets,
  styles
] = await Promise.all([
  readProjectFile("package.json"),
  readProjectFile("astro.config.mjs"),
  readProjectFile("src/content.config.ts"),
  readProjectFile("src/data/projects.ts"),
  readProjectFile("src/pages/projects.astro"),
  readProjectFile("src/pages/projects/[slug].astro"),
  readProjectFile("src/content/projects/aeris.mdx"),
  readProjectFile("src/data/launchAssets.ts"),
  readProjectFile("src/styles/global.css")
]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:projects"] === "node scripts/validate-projects.mjs",
  "Expected npm run test:projects to execute the projects validator"
);
assert(Boolean(packageJson.dependencies?.["@astrojs/mdx"]), "Expected @astrojs/mdx dependency");
assert(astroConfig.includes("mdx()"), "Expected Astro MDX integration");
assert(
  contentConfig.includes("defineCollection") &&
    contentConfig.includes("glob") &&
    contentConfig.includes("src/content/projects") &&
    contentConfig.includes("**/*.{md,mdx}"),
  "Expected Astro 6 projects content collection"
);

assert(projectsPage.includes(projectIntro), "Expected Projects intro copy");
assertInOrder(projectData, ['id: "aeris"', 'id: "soilos"'], "Expected Aeris before Soilos");

for (const snippet of [
  'href: "/projects/aeris/"',
  "projectLinks.aeris.liveApp",
  "projectLinks.aeris.github",
  "projectScreenshots.aeris[0]",
  "Aeris live app",
  "Aeris GitHub",
  "Read the story"
]) {
  assert(
    projectData.includes(snippet) ||
      projectsPage.includes(snippet) ||
      launchAssets.includes(snippet),
    `Missing Projects Index Aeris entry detail: ${snippet}`
  );
}

assert(
  !projectsPage.includes("projectLinks.soilos.liveApp") &&
    !projectsPage.includes("projectLinks.soilos.github"),
  "Expected Soilos to avoid public live/GitHub CTAs"
);

assert(
  aerisPage.includes("getCollection") &&
    aerisPage.includes("render") &&
    aerisPage.includes("<Content") &&
    aerisPage.includes("project-detail"),
  "Expected project detail route to render MDX collection content"
);

for (const heading of requiredAerisSections) {
  assert(aerisContent.includes(`## ${heading}`), `Missing Aeris section: ${heading}`);
}

for (const snippet of requiredAerisCopy) {
  assert(aerisContent.includes(snippet), `Missing Aeris writeup copy: ${snippet}`);
}

assert(
  aerisContent.indexOf("## Product Decisions") < aerisContent.indexOf("## Technical Approach"),
  "Expected Aeris writeup to emphasize product thinking before technical architecture"
);
assert(
  aerisContent.indexOf("AI-assisted learning") > aerisContent.indexOf("## What I Learned"),
  "Expected AI-assisted learning to appear only in What I Learned"
);

for (const screenshotPath of requiredScreenshots) {
  assert(
    projectData.includes(screenshotPath) || aerisContent.includes(screenshotPath),
    `Expected Aeris screenshot to be used: ${screenshotPath}`
  );
}

assert(
  projectData.includes("Built with") || aerisPage.includes("Built with"),
  "Expected restrained Built with line"
);

for (const rejected of rejectedProjectText) {
  assert(
    !`${projectData}\n${projectsPage}\n${aerisContent}`.toLowerCase().includes(rejected.toLowerCase()),
    `Unexpected project placeholder/badge text remains: ${rejected}`
  );
}

for (const className of [
  ".project-detail",
  ".project-detail__hero",
  ".project-detail__media",
  ".project-writeup",
  ".project-screenshot-grid"
]) {
  assert(styles.includes(className), `Missing project detail styling: ${className}`);
}

console.log("Issue #8 Projects Index and Aeris detail checks passed.");
