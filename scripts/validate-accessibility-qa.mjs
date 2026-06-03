import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const pages = [
  "src/pages/index.astro",
  "src/pages/experience.astro",
  "src/pages/projects.astro",
  "src/pages/projects/[slug].astro",
  "src/pages/resume.astro",
  "src/pages/contact.astro",
  "src/pages/404.astro"
];

const colorPairs = [
  {
    label: "resume orange on page background",
    foreground: "#a94c1f",
    background: "#f4f6f2",
    minimum: 4.5
  },
  {
    label: "resume orange on white surface",
    foreground: "#a94c1f",
    background: "#ffffff",
    minimum: 4.5
  },
  {
    label: "resume orange on cream background",
    foreground: "#a94c1f",
    background: "#f7f2e6",
    minimum: 4.5
  },
  {
    label: "white primary button text on resume orange",
    foreground: "#ffffff",
    background: "#a94c1f",
    minimum: 4.5
  },
  {
    label: "muted text on page background",
    foreground: "#626d64",
    background: "#f4f6f2",
    minimum: 4.5
  }
];

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getCssVariable(styles, name) {
  const match = styles.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6});`));

  assert(match, `Missing CSS variable: ${name}`);

  return match[1].toLowerCase();
}

function getHeadingTags(source) {
  const matches = source.matchAll(/<h([1-6])\b/g);

  return Array.from(matches, (match) => `h${match[1]}`);
}

function assertHeadingOrder(filePath, source) {
  const headings = getHeadingTags(source);

  assert(headings.length > 0, `${filePath} must include at least one heading`);
  assert(headings[0] === "h1", `${filePath} must start heading order with h1`);
  assert(
    headings.every((heading, index) => {
      if (index === 0) {
        return true;
      }

      const currentLevel = Number(heading.slice(1));
      const previousLevel = Number(headings[index - 1].slice(1));

      return currentLevel <= previousLevel + 1;
    }),
    `${filePath} heading order skips a level: ${headings.join(", ")}`
  );
}

function relativeLuminance(hex) {
  const [red, green, blue] = hex.match(/[0-9a-f]{2}/gi).map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;

    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function assertContrast() {
  for (const { label, foreground, background, minimum } of colorPairs) {
    const ratio = contrastRatio(foreground, background);

    assert(
      ratio >= minimum,
      `${label} contrast ${ratio.toFixed(2)} must be at least ${minimum}`
    );
  }
}

const [packageJsonSource, layout, navigation, styles, launchAssets, ...pageSources] =
  await Promise.all([
    readProjectFile("package.json"),
    readProjectFile("src/layouts/BaseLayout.astro"),
    readProjectFile("src/components/LaunchNavigation.astro"),
    readProjectFile("src/styles/global.css"),
    readProjectFile("src/data/launchAssets.ts"),
    ...pages.map(readProjectFile)
  ]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:accessibility"] ===
    "node scripts/validate-accessibility-qa.mjs",
  "Expected npm run test:accessibility to execute the accessibility validator"
);

assert(layout.includes('href="#main-content"'), "Expected skip link href");
assert(layout.includes('id="main-content"'), "Expected skip link target");
assert(layout.includes('tabindex="-1"'), "Expected programmatic main focus target");
assert(layout.includes("mainContent.focus"), "Expected skip link to focus main content");

assert(
  navigation.includes('aria-hidden="true"') &&
    navigation.includes("panel.inert") &&
    navigation.includes('panel.toggleAttribute("inert"') &&
    navigation.includes("event.key === \"Escape\"") &&
    navigation.includes("toggle.focus"),
  "Expected mobile menu aria-hidden, inert property/attribute, Escape close, and focus return behavior"
);
assert(
  /\.mobile-navigation\[hidden\]\s*{\s*display:\s*none;\s*}/.test(styles),
  "Expected hidden mobile navigation to be removed from layout and tab order"
);

const colorResume = getCssVariable(styles, "--color-resume");
assert(colorResume === "#a94c1f", "Expected accessible resume orange token");
assertContrast();

assert(
  styles.includes("a:focus-visible") &&
    styles.includes("button:focus-visible") &&
    styles.includes("box-shadow: 0 0 0") &&
    styles.includes("var(--color-cream)") &&
    styles.includes("var(--color-accent-strong)"),
  "Expected strong two-tone global focus-visible ring"
);
assert(
  styles.includes("@media (prefers-reduced-motion: reduce)") &&
    styles.includes("transition-property: none !important") &&
    styles.includes("animation-name: none !important"),
  "Expected explicit reduced-motion transition and animation removal"
);

assert(
  launchAssets.includes("Empty forest trail opening toward distant mountains in warm evening light."),
  "Expected Hero Landscape alt text to describe the trail, forest, and mountain identity image"
);
assert(!launchAssets.includes('alt: ""'), "Expected no empty alt in launch asset data");
assert(!launchAssets.includes('reviewStatus: "pending"'), "Expected all launch assets reviewed");

for (const [index, filePath] of pages.entries()) {
  const source = pageSources[index];

  assertHeadingOrder(filePath, source);
}

for (const source of pageSources) {
  const imageTags = source.match(/<img\b[^>]*>/g) ?? [];

  for (const imageTag of imageTags) {
    assert(
      /\salt=/.test(imageTag),
      `Expected every page image to provide alt text: ${imageTag}`
    );
  }
}

console.log("Issue #11 accessibility and responsive QA checks passed.");
