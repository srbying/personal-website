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
  "Mar 2025 - Mar 2026",
  "Mar 2021 - Apr 2025",
  "Feb 2018 - Mar 2021",
  "Nov 2016 - Feb 2018",
  "Mar 2015 - Nov 2016",
  "2015 - 2016"
];

const rejectedPageText = [
  "Private-sector experience",
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

function roleBlock(source, roleId, nextRoleId) {
  const start = source.indexOf(`id: "${roleId}"`);
  const end = nextRoleId ? source.indexOf(`id: "${nextRoleId}"`) : source.length;

  assert(start !== -1, `Missing role block: ${roleId}`);
  assert(end > start, `Missing next role block after: ${roleId}`);

  return source.slice(start, end);
}

function technologiesForRole(source, roleId, nextRoleId) {
  const block = roleBlock(source, roleId, nextRoleId);
  const match = block.match(/technologies:\s*\[(?<items>[\s\S]*?)\]/);

  assert(match?.groups?.items, `Missing technologies for role: ${roleId}`);

  return Array.from(match.groups.items.matchAll(/"([^"]+)"/g), (item) => item[1]);
}

function cssRule(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`${escapedSelector}\\s*{(?<body>[^}]*)}`));

  assert(match?.groups?.body, `Missing CSS rule: ${selector}`);

  return match.groups.body;
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

assert(
  experienceData.includes('label: "Leadership Focus"') &&
    experienceData.includes(
      "Leading product-minded engineering teams through ambiguity, operational complexity, and meaningful customer impact."
    ),
  "Expected Current Focus to be renamed Leadership Focus with requested subtext"
);
assert(
  !experienceData.includes("timelineHeading") &&
    !experienceData.includes("timelineLead") &&
    !experienceData.includes("Private-sector experience"),
  "Expected Experience timeline to render without a separate intro heading or subheading"
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
    experienceData.includes("Fire Team Leader & Radio Operator"),
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

const managerTechnologies = [
  "Ruby on Rails",
  "AWS",
  "Next.js",
  "Node.js",
  "React",
  "TypeScript",
  "Jira",
  "Graphql",
  "Github",
  "Braintree",
  "Agile Methodologies",
  "AI-assisted engineering workflows"
];
const seniorTechnologies = [
  "Ruby on Rails",
  "Next.js",
  "Node.js",
  "React",
  "Jira",
  "Datadog",
  "Github",
  "CI/CD",
  "AI-assisted engineering workflows"
];
assert(
  JSON.stringify(technologiesForRole(experienceData, "animoto-manager", "animoto-senior-engineer")) ===
    JSON.stringify(managerTechnologies),
  "Expected Software Engineering Manager selected technologies to match requested list"
);
assert(
  JSON.stringify(technologiesForRole(experienceData, "animoto-senior-engineer", "nike-full-stack-engineer")) ===
    JSON.stringify(seniorTechnologies),
  "Expected Senior Full Stack Software Engineer selected technologies to match requested list"
);
assert(
  technologiesForRole(experienceData, "nike-full-stack-engineer", "discoverorg-software-developer").includes("Java"),
  "Expected Nike selected technologies to include Java"
);

const managerBlock = roleBlock(
  experienceData,
  "animoto-manager",
  "animoto-senior-engineer"
);
for (const presentTense of ["Leads ", "Manages ", "Develops ", "Grows "]) {
  assert(
    !managerBlock.includes(presentTense),
    `Expected completed Animoto manager role to avoid present-tense phrasing: ${presentTense}`
  );
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
  "Selected Technologies"
]) {
  assert(experiencePage.includes(snippet), `Missing Experience page rendering: ${snippet}`);
}

assert(
  !experiencePage.includes("experience-section__heading") &&
    !experiencePage.includes("timelineLead") &&
    !experiencePage.includes("experience-heading"),
  "Expected hero divider to flow directly into the experience timeline"
);

const experienceSectionRule = cssRule(styles, ".experience-section");
const experienceTimelineRule = cssRule(styles, ".experience-timeline");
assert(
  experienceSectionRule.includes("padding-block: 0;") &&
    experienceSectionRule.includes("border-block-end: 1px solid var(--color-border);") &&
    experienceTimelineRule.includes("display: grid;") &&
    !experienceTimelineRule.includes("border-block-start"),
  "Expected one hero divider before timeline with no extra top border or padding"
);

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
  homeData.includes("experiencePreview"),
  "Home missing experiencePreview export reference"
);
assert(
  experienceData.includes("Mar 2021 - Mar 2026"),
  "Experience preview missing completed Animoto date range"
);
assert(
  !homeData.includes("Mar 2021-Mar 2026"),
  "Home still contains old hardcoded date"
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
