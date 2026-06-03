import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/data/experience.ts",
  "src/pages/experience.astro",
  "src/styles/global.css"
];

const privateSectorRoles = [
  "Software Engineering Manager",
  "Senior Full Stack Software Engineer",
  "Full Stack Engineer",
  "Software Developer",
  "Consultant - Software Engineer"
];

const requiredCompanies = [
  "Animoto",
  "Nike",
  "DiscoverOrg (now ZoomInfo)",
  "Catalyst DevWorks",
  "Renovate America / HealthSparq"
];

const requiredDates = [
  "Mar 2025 - Present",
  "Mar 2021 - Apr 2025",
  "Feb 2018 - Mar 2021",
  "Nov 2016 - Feb 2018",
  "Mar 2015 - Nov 2016",
  "2015 - 2016"
];

const rejectedPageText = [
  "Professional experience content will build",
  "future slice",
  "company logo",
  "company-logo",
  "milestone",
  "launch page"
];

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

const [experienceData, experiencePage, homeData, resumeData, styles, packageJsonSource] =
  await Promise.all([
    readProjectFile("src/data/experience.ts"),
    readProjectFile("src/pages/experience.astro"),
    readProjectFile("src/data/home.ts"),
    readProjectFile("src/data/resume.ts"),
    readProjectFile("src/styles/global.css"),
    readProjectFile("package.json")
  ]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:experience"] === "node scripts/validate-experience.mjs",
  "Expected npm run test:experience to execute the experience validator"
);

for (const exportName of ["experiencePage", "experienceRoles", "experienceMilitaryService"]) {
  assert(experienceData.includes(`export const ${exportName}`), `Missing experience export: ${exportName}`);
}

for (const role of privateSectorRoles) {
  assert(experienceData.includes(role), `Missing private-sector role: ${role}`);
}

for (const company of requiredCompanies) {
  assert(experienceData.includes(company), `Missing company: ${company}`);
}

for (const dateRange of requiredDates) {
  assert(experienceData.includes(dateRange), `Missing role date range: ${dateRange}`);
}

assert(
  experienceData.includes("United States Marine Corps Reserve") &&
    experienceData.includes("Fire Team Leader & Radio Operator, Command Center"),
  "Expected Military Service data to stay separate from private-sector roles"
);

const firstAnimotoIndex = experienceData.indexOf('id: "animoto-manager"');
const secondAnimotoIndex = experienceData.indexOf('id: "animoto-senior-engineer"');
const nikeIndex = experienceData.indexOf('id: "nike-full-stack-engineer"');
assert(firstAnimotoIndex !== -1 && secondAnimotoIndex !== -1, "Expected both Animoto roles");
assert(
  firstAnimotoIndex < secondAnimotoIndex && secondAnimotoIndex < nikeIndex,
  "Expected Animoto role progression to stay adjacent and chronological before Nike"
);

const technologyLists = experienceData.match(/technologies:\s*\[[\s\S]*?\]/g) ?? [];
assert(technologyLists.length >= 4, "Expected selected technologies where useful");
for (const list of technologyLists) {
  const itemCount = (list.match(/"/g) ?? []).length / 2;
  assert(itemCount <= 6, "Expected selected technology lists to stay light");
}

for (const rejected of rejectedPageText) {
  assert(
    !experiencePage.toLowerCase().includes(rejected.toLowerCase()),
    `Unexpected Experience placeholder/decorative text remains: ${rejected}`
  );
}

for (const snippet of [
  "experiencePage",
  "experienceRoles",
  "experienceMilitaryService",
  "Selected Impact",
  "Selected Technologies",
  "Private-sector experience"
]) {
  assert(experiencePage.includes(snippet), `Missing Experience page rendering: ${snippet}`);
}

assert(
  experienceData.includes("Military Service") &&
    experiencePage.includes("experiencePage.militaryHeading"),
  "Expected Military Service section label to render from experience data"
);

assert(
  experiencePage.indexOf("experience-timeline") < experiencePage.indexOf("experience-military"),
  "Expected Military Service section after private-sector timeline"
);

assert(
  homeData.includes("experiencePreview") &&
    experienceData.includes("Mar 2021 - Present") &&
    !homeData.includes("Mar 2021-Mar 2026"),
  "Expected Home recent experience preview to derive from current experience data"
);

assert(
  resumeData.includes("experienceRoles") && resumeData.includes("resumeExperience"),
  "Expected Resume experience exports to share canonical experience data"
);

for (const className of [
  ".experience-hero",
  ".experience-timeline",
  ".experience-role",
  ".experience-military"
]) {
  assert(styles.includes(className), `Missing Experience styling: ${className}`);
}

console.log("Issue #6 full experience path checks passed.");
