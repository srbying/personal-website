import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/content.config.ts",
  "src/content/projects/aeris.mdx",
  "src/content/projects/soilos.mdx",
  "src/pages/projects.astro",
  "src/pages/projects/[slug].astro",
  "src/data/launchAssets.ts",
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

const requiredSoilosSections = [
  "Overview",
  "Why I Built It",
  "Product Decisions",
  "Technical Approach",
  "What I Learned",
  "Screenshots",
  "What I'd Do Next"
];

const requiredSoilosCopy = [
  "personal lawn-care planning app",
  "local weather",
  "soil data",
  "seasonal tasks",
  "budget tracking",
  "progress photos",
  "practical multi-year plan",
  "market research",
  "scenario comparison",
  "budget and risk tradeoffs",
  "product calculator"
];

const requiredAerisScreenshots = [
  "/assets/projects/aeris/chat-response.png",
  "/assets/projects/aeris/chat-loading.png",
  "/assets/projects/aeris/activity-history.png",
  "/assets/projects/aeris/trend-evidence.png",
  "/assets/projects/aeris/import-csv.png"
];

const requiredSoilosScreenshots = [
  "/assets/projects/soilos/action-status.png",
  "/assets/projects/soilos/scenario-comparison.png",
  "/assets/projects/soilos/calculator.png",
  "/assets/projects/soilos/calendar-task-detail.png",
  "/assets/projects/soilos/calendar-month.png"
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
  soilosContent,
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
  readProjectFile("src/content/projects/soilos.mdx"),
  readProjectFile("src/data/launchAssets.ts"),
  readProjectFile("src/styles/global.css")
]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:projects"] === "node scripts/validate-projects.mjs",
  "Expected npm run test:projects to execute the projects validator"
);
assert(
  Boolean(
    packageJson.dependencies?.["@astrojs/mdx"] ||
      packageJson.devDependencies?.["@astrojs/mdx"]
  ),
  "Expected @astrojs/mdx dependency"
);
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
  projectData.includes('detailHref: "/projects/soilos/"') &&
    projectData.includes('href: "/projects/soilos/"') &&
    projectData.includes('title: "SoilOS"') &&
    projectData.includes("projectScreenshots.soilos[0]") &&
    launchAssets.includes('path: "/assets/projects/soilos/action-status.png"') &&
    projectData.includes('"local weather data"') &&
    projectData.includes('"soil data"') &&
    projectData.includes('"planning dashboards"'),
  "Expected SoilOS project entry to use approved preview screenshot, link to detail, and use a restrained Built with line"
);

assert(
  !projectData.includes("projectLinks.soilos.liveApp") &&
    !projectData.includes("projectLinks.soilos.github") &&
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
  soilosContent.includes('title: "SoilOS"') &&
    soilosContent.includes('projectId: "soilos"') &&
    soilosContent.includes("SoilOS is a personal lawn-care planning app"),
  "Expected SoilOS content to use requested display spelling and reference projectId: soilos"
);

for (const heading of requiredSoilosSections) {
  assert(soilosContent.includes(`## ${heading}`), `Missing Soilos section: ${heading}`);
}

for (const snippet of requiredSoilosCopy) {
  assert(soilosContent.includes(snippet), `Missing Soilos writeup copy: ${snippet}`);
}

assert(
  aerisContent.indexOf("## Product Decisions") < aerisContent.indexOf("## Technical Approach"),
  "Expected Aeris writeup to emphasize product thinking before technical architecture"
);
assert(
  soilosContent.indexOf("## Product Decisions") < soilosContent.indexOf("## Technical Approach"),
  "Expected Soilos writeup to emphasize product thinking before technical architecture"
);
assert(
  aerisContent.indexOf("AI-assisted learning") > aerisContent.indexOf("## What I Learned"),
  "Expected AI-assisted learning to appear only in What I Learned"
);
assert(
  !soilosContent.includes("AI-assisted learning"),
  "Expected Soilos to omit AI-assisted learning unless it supports the story"
);

for (const screenshotPath of requiredAerisScreenshots) {
  assert(
    projectData.includes(screenshotPath) || aerisContent.includes(screenshotPath),
    `Expected Aeris screenshot to be used: ${screenshotPath}`
  );
}

for (const screenshotPath of requiredSoilosScreenshots) {
  assert(
    projectData.includes(screenshotPath) ||
      soilosContent.includes(screenshotPath) ||
      launchAssets.includes(screenshotPath),
    `Expected Soilos screenshot to be used: ${screenshotPath}`
  );
}

assert(
  projectData.includes("Built with") || aerisPage.includes("Built with"),
  "Expected restrained Built with line"
);

for (const rejected of rejectedProjectText) {
  assert(
    !`${projectData}\n${projectsPage}\n${aerisContent}\n${soilosContent}`.toLowerCase().includes(rejected.toLowerCase()),
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

console.log("Issue #8 and #9 project checks passed.");
