import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import siteConfig from "../src/data/siteConfig.json" with { type: "json" };

const root = process.cwd();
const resumePdfPublicFile = `public${siteConfig.resumePdfRoute}`;

const requiredFiles = [
  "src/data/resume.ts",
  "src/data/experience.ts",
  "src/pages/resume.astro",
  "src/styles/global.css",
  "src/data/launchAssets.ts",
  resumePdfPublicFile
];

const requiredResumeData = [
  "Engineering Manager with 10+ years",
  "Software Engineering Manager",
  "Senior Full Stack Software Engineer",
  "Full Stack Engineer",
  "DiscoverOrg (now ZoomInfo)",
  "Catalyst DevWorks",
  "Renovate America / HealthSparq",
  "Leadership & Delivery",
  "Frontend",
  "Java",
  "Ruby on Rails",
  "Graphql",
  "Cloud & Infrastructure",
  "Data & Observability",
  "Scrum Master Certified (SMC)",
  "Bowling Green State University",
  "United States Marine Corps Reserve",
  "contactLinks.email",
  "resumePdf.path"
];

const requiredPageSnippets = [
  "resumeHeader.pdfPath",
  "download",
  "resumeSummary",
  "resumeExperience",
  "resumeSkillGroups",
  "resumeCredentials",
  "resumeMilitaryService",
  "resumeContactLinks",
  "aria-label=\"Steven Byington resume\""
];

const sectionOrder = [
  "Summary",
  "Experience",
  "Technical Skills",
  "Education & Certifications",
  "Military Service",
  "Contact"
];

const usStateAbbreviationPattern =
  "A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]";

const rejectedLaunchFeatures = [
  "Resume content will build",
  "<iframe",
  "<embed",
  "<object",
  "copy as markdown",
  "copy-as-markdown",
  "short resume",
  "short variant"
];

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizePrivacySource(source) {
  return source
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertNoPrivateResumeDetails(source) {
  const normalizedSource = normalizePrivacySource(source);

  assert(
    !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(normalizedSource),
    "Rendered HTML resume source must not expose email-like text"
  );
  assert(!/\btel:/i.test(source), "Rendered HTML resume source must not expose telephone links");
  assert(
    !/(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}/.test(
      normalizedSource
    ),
    "Rendered HTML resume source must not expose phone-number-like text"
  );
  assert(
    !/\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way)\b/i.test(
      normalizedSource
    ),
    "Rendered HTML resume source must not expose street-address-like text"
  );
  assert(
    !new RegExp(
      `\\b[A-Z][A-Za-z.'-]+(?:\\s+[A-Z][A-Za-z.'-]+){0,2},\\s+(?:${usStateAbbreviationPattern})\\b`
    ).test(normalizedSource),
    "Rendered HTML resume source must not expose city-and-state-style text"
  );
}

for (const filePath of requiredFiles) {
  assert(existsSync(path.join(root, filePath)), `Missing required file: ${filePath}`);
}

const [resumeData, experienceData, resumePage, styles, manifest, packageJsonSource] =
  await Promise.all([
    readProjectFile("src/data/resume.ts"),
    readProjectFile("src/data/experience.ts"),
    readProjectFile("src/pages/resume.astro"),
    readProjectFile("src/styles/global.css"),
    readProjectFile("src/data/launchAssets.ts"),
    readProjectFile("package.json")
  ]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:resume"] === "node scripts/validate-resume.mjs",
  "Expected npm run test:resume to execute the resume validator"
);

assert(
  existsSync(path.join(root, resumePdfPublicFile)) &&
    manifest.includes("path: siteConfig.resumePdfRoute"),
  "Expected resume PDF to be served from the descriptive public path"
);
assert(
  manifest.includes("steven@stevenbyington.me"),
  "Expected Resume contact paths to use the confirmed public email"
);
assert(
  resumeData.includes("pdfPath: resumePdf.path") &&
    resumePage.includes("href={resumeHeader.pdfPath}"),
  "Expected the Resume page PDF link to use the approved resumePdf path"
);

const resumeContentSources = `${resumeData}\n${experienceData}`;

for (const snippet of requiredResumeData) {
  assert(resumeContentSources.includes(snippet), `Missing resume data: ${snippet}`);
}

for (const snippet of requiredPageSnippets) {
  assert(resumePage.includes(snippet), `Missing resume page rendering: ${snippet}`);
}

const sectionIndexes = sectionOrder.map((label) => resumePage.indexOf(`>${label}<`));
assert(
  sectionIndexes.every((index) => index !== -1),
  "Expected every required Resume section label"
);
assert(
  sectionIndexes.every((index, position) => position === 0 || index > sectionIndexes[position - 1]),
  "Expected Resume sections in launch order"
);

assert(
  resumeData.includes("experienceRoles") && resumeData.includes("sharedExperienceMilitaryService"),
  "Expected resume role history to derive from shared experience data"
);

const publicHtmlSources = `${resumeContentSources}\n${resumePage}`;
assertNoPrivateResumeDetails(publicHtmlSources);

const lowerCasePage = resumePage.toLowerCase();
for (const rejected of rejectedLaunchFeatures) {
  assert(
    !lowerCasePage.includes(rejected.toLowerCase()),
    `Unexpected Resume launch feature or placeholder remains: ${rejected}`
  );
}

assert(
  styles.includes("@media print") &&
    styles.includes(".resume-hero__actions") &&
    styles.includes(".site-header") &&
    styles.includes(".site-footer"),
  "Expected print-friendly Resume styling that hides action UI and site chrome"
);

console.log("Issue #5 web-native resume checks passed.");
