import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "astro.config.mjs",
  "tsconfig.json",
  "src/components/LaunchNavigation.astro",
  "src/components/SiteFooter.astro",
  "src/data/content.ts",
  "src/data/experience.json",
  "src/data/projects.json",
  "src/data/site.ts",
  "src/layouts/BaseLayout.astro",
  "src/pages/404.astro",
  "src/pages/index.astro",
  "src/styles/global.css"
];

const navOrder = ["Home", "Experience", "Projects", "Resume", "Contact"];
const footerLabels = ["Email", "LinkedIn", "GitHub", "Resume PDF"];
const notFoundLinks = ["Home", "Resume", "Contact"];

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const filePath of requiredFiles) {
  assert(existsSync(path.join(root, filePath)), `Missing required file: ${filePath}`);
}

assert(
  !existsSync(path.join(root, "src/content/config.ts")),
  "Expected no legacy Astro content config at src/content/config.ts"
);
assert(
  existsSync(path.join(root, "src/content/projects/aeris.mdx")) ||
    !existsSync(path.join(root, "src/content.config.ts")),
  "Expected no Astro content collection config until real content exists"
);

const packageJson = JSON.parse(await readProjectFile("package.json"));
assert(packageJson.scripts?.dev === "astro dev", "Expected npm run dev to execute astro dev");
assert(packageJson.scripts?.build === "astro build", "Expected npm run build to execute astro build");
assert(packageJson.scripts?.preview === "astro preview", "Expected npm run preview to execute astro preview");
assert(Boolean(packageJson.dependencies?.astro), "Expected Astro dependency");
assert(Boolean(packageJson.devDependencies?.typescript), "Expected TypeScript dev dependency");
assert(
  packageJson.engines?.node === ">=22.12.0",
  "Expected package.json to declare the Node runtime required by Astro 6"
);

const astroConfig = await readProjectFile("astro.config.mjs");
assert(astroConfig.includes("defineConfig"), "Expected Astro defineConfig usage");
assert(astroConfig.includes("output: \"static\""), "Expected static Astro output");

const tsConfig = await readProjectFile("tsconfig.json");
assert(tsConfig.includes("astro/tsconfigs"), "Expected tsconfig to extend Astro TypeScript config");
assert(tsConfig.includes("\".astro/types.d.ts\""), "Expected generated Astro types in tsconfig include");

const contentConventions = await readProjectFile("src/data/content.ts");
assert(contentConventions.includes("ProjectContent"), "Expected typed project content convention");
assert(contentConventions.includes("ExperienceContent"), "Expected typed experience content convention");
assert(contentConventions.includes("contentSources"), "Expected centralized content source paths");

const siteData = await readProjectFile("src/data/site.ts");
const navIndexes = navOrder.map((label) => siteData.indexOf(`label: "${label}"`));
assert(navIndexes.every((index) => index !== -1), "Expected every launch navigation item");
assert(
  navIndexes.every((index, position) => position === 0 || index > navIndexes[position - 1]),
  "Expected launch navigation order: Home, Experience, Projects, Resume, Contact"
);
assert(
  !siteData.includes("isHighlighted: true"),
  "Expected navigation highlight to be route-driven, not hard-coded to Resume"
);
for (const label of footerLabels) {
  assert(siteData.includes(`label: "${label}"`), `Expected footer link label: ${label}`);
}

const layout = await readProjectFile("src/layouts/BaseLayout.astro");
assert(layout.includes("href=\"#main-content\""), "Expected skip link target");
assert(layout.includes("id=\"main-content\""), "Expected main content target for skip link");
assert(layout.includes("SiteFooter"), "Expected shared footer in base layout");
assert(layout.includes("LaunchNavigation"), "Expected shared launch navigation in base layout");

const navigation = await readProjectFile("src/components/LaunchNavigation.astro");
assert(
  navigation.includes("aria-current") && navigation.includes("navigation-link--active"),
  "Expected navigation active state to use aria-current and active classes"
);
assert(navigation.includes("aria-expanded=\"false\""), "Expected accessible mobile menu disclosure state");
assert(navigation.includes("aria-controls=\"mobile-navigation\""), "Expected mobile menu controls relationship");
assert(navigation.includes("prefers-reduced-motion: reduce"), "Expected reduced-motion-aware menu behavior");
assert(navigation.includes("astro:page-load"), "Expected mobile menu script to rebind after Astro page loads");
assert(
  navigation.includes('window.matchMedia("(min-width: 841px)")'),
  "Expected desktop JS breakpoint to match the CSS max-width: 840px breakpoint"
);
assert(
  navigation.includes("handleDesktopQueryChange(desktopQuery)"),
  "Expected desktop media query handler to run once on initialization"
);

const notFound = await readProjectFile("src/pages/404.astro");
assert(
  notFound.includes("This trail doesn't lead anywhere"),
  "Expected required 404 phrase"
);
for (const label of notFoundLinks) {
  assert(notFound.includes(`>${label}<`), `Expected 404 link to ${label}`);
}

console.log("Issue #2 shell acceptance checks passed.");
