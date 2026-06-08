import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/pages/contact.astro",
  "src/components/SiteFooter.astro",
  "src/components/LaunchNavigation.astro",
  "src/data/site.ts",
  "src/data/launchAssets.ts",
  "package.json"
];

const contactIntro =
  "The best way to reach me is by email. You can also find me on LinkedIn.";

const contactOrder = [
  "contactLinks.email",
  "contactLinks.linkedIn",
  "contactLinks.github",
  "contactLinks.resumePdf"
];

const footerLabels = ["Email", "LinkedIn", "GitHub", "Resume PDF"];

const rejectedContactText = [
  "<form",
  "opportunity",
  "phone",
  "physical location",
  "public location",
  "address",
  "beaverton",
  "portland",
  "oregon",
  "(971)",
  "331-5101"
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
  contactPage,
  footer,
  navigation,
  siteData,
  launchAssets,
  packageJsonSource
] = await Promise.all([
  readProjectFile("src/pages/contact.astro"),
  readProjectFile("src/components/SiteFooter.astro"),
  readProjectFile("src/components/LaunchNavigation.astro"),
  readProjectFile("src/data/site.ts"),
  readProjectFile("src/data/launchAssets.ts"),
  readProjectFile("package.json")
]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:contact"] === "node scripts/validate-contact.mjs",
  "Expected npm run test:contact to execute the contact validator"
);

assert(contactPage.includes("title=\"Contact\""), "Expected Contact page title");
assert(contactPage.includes(contactIntro), "Expected exact Contact page intro copy");
assertInOrder(
  contactPage,
  contactOrder,
  "Expected Contact page links in order: Email, LinkedIn, GitHub, Resume PDF"
);

for (const snippet of [
  'href: "mailto:steven@stevenbyington.me"',
  'displayText: "steven@stevenbyington.me"',
  'href: "https://www.linkedin.com/in/stevenbyington/"',
  'href: "https://github.com/srbying"',
  'href: resumePdf.path'
]) {
  assert(launchAssets.includes(snippet), `Missing canonical contact data: ${snippet}`);
}

for (const rejected of rejectedContactText) {
  assert(
    !contactPage.toLowerCase().includes(rejected),
    `Contact page must not expose or pitch: ${rejected}`
  );
}

assert(
  contactPage.includes('target={link.isExternal && !link.href.startsWith("mailto:") ? "_blank" : undefined}'),
  "Expected Contact external links to open in a new tab"
);
assert(
  contactPage.includes('rel={link.isExternal && !link.href.startsWith("mailto:") ? "noopener noreferrer" : undefined}'),
  "Expected Contact external links to use noopener noreferrer"
);
assert(
  contactPage.includes('download={!link.isExternal && link.href.endsWith(".pdf") ? true : undefined}'),
  "Expected Contact Resume PDF link to download"
);

assertInOrder(
  siteData,
  footerLabels.map((label) => `label: "${label}"`),
  "Expected footer link order: Email, LinkedIn, GitHub, Resume PDF"
);
assert(
  siteData.includes("contactLinks.resumePdf.href"),
  "Expected footer Resume PDF to use canonical contactLinks data"
);
assert(
  footer.includes("footerLinks.map") &&
    footer.includes('target={link.isExternal && !link.href.startsWith("mailto:") ? "_blank" : undefined}') &&
    footer.includes('rel={link.isExternal && !link.href.startsWith("mailto:") ? "noopener noreferrer" : undefined}') &&
    footer.includes('download={!link.isExternal && link.href.endsWith(".pdf") ? true : undefined}'),
  "Expected footer contact links to use compact text links with safe external behavior"
);

assert(
  !navigation.includes("contactLinks.github") &&
    !navigation.includes("GitHub") &&
    !siteData
      .slice(
        siteData.indexOf("export const launchNavigation"),
        siteData.indexOf("export const footerLinks")
      )
      .includes('label: "GitHub"'),
  "Expected GitHub to stay out of main navigation"
);

console.log("Issue #7 Contact and footer path checks passed.");
