import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const homeDataPath = "src/data/home.ts";
const homePagePath = "src/pages/index.astro";
const experienceDataPath = "src/data/experience.ts";
const packagePath = "package.json";

const rejectedText = [
  "I build teams. I build what matters.",
  "Engineering Manager with 10+ years of full-stack experience."
];

const heroText = [
  "Software Engineering Manager",
  "I help product-minded teams build with clarity, ownership, and technical judgment.",
  "Engineering Manager · Full-Stack Depth · USMC Veteran"
];

const ctaExpectations = [
  { label: "Download My Resume", href: "resumePdf.path" },
  { label: "See My Experience", href: "/experience/" },
  { label: "Contact Steven", href: "/contact/" }
];

const recentExperience = [
  {
    company: "Animoto",
    role: "Senior Full Stack Software Engineer to Software Engineering Manager",
    dateRange: "Mar 2021 - Present"
  },
  {
    company: "Nike",
    role: "Full Stack Engineer",
    dateRange: "Feb 2018 - Mar 2021"
  },
  {
    company: "DiscoverOrg (now ZoomInfo)",
    role: "Software Developer",
    dateRange: "Nov 2016 - Feb 2018"
  }
];

const leadershipPrinciples = [
  "Clarity",
  "Accountability",
  "Ownership",
  "Calm Under Pressure",
  "Respectful Candor",
  "Technical Judgment"
];

const marineCorpsLeadershipPattern =
  /shared standard.*own the outcome.*close the loop/is;
const blockedProjectMarkers = [
  'href="/projects/"',
  "overview-card",
  "projects-section"
];

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(existsSync(path.join(root, homeDataPath)), `Missing ${homeDataPath}`);
assert(existsSync(path.join(root, homePagePath)), `Missing ${homePagePath}`);
assert(existsSync(path.join(root, experienceDataPath)), `Missing ${experienceDataPath}`);

const [homeData, homePage, experienceData, packageJsonSource] = await Promise.all([
  readProjectFile(homeDataPath),
  readProjectFile(homePagePath),
  readProjectFile(experienceDataPath),
  readProjectFile(packagePath)
]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:home"] === "node scripts/validate-home.mjs",
  "Expected npm run test:home to execute the homepage validator"
);

for (const snippet of rejectedText) {
  assert(
    !homeData.includes(snippet) && !homePage.includes(snippet),
    `Rejected homepage text is still present: ${snippet}`
  );
}

for (const snippet of heroText) {
  assert(homeData.includes(snippet), `Missing hero text in ${homeDataPath}: ${snippet}`);
}

assert(
  homePage.includes("heroLandscape") && homePage.includes("heroLandscape.alt"),
  "Expected homepage hero to use the approved Hero Landscape asset and alt text"
);
assert(
  !homePage.includes("brandAssets") && !homePage.includes("logoLockup"),
  "Expected no repeated homepage logo asset in the hero"
);

for (const { label, href } of ctaExpectations) {
  assert(homeData.includes(label), `Missing CTA label in ${homeDataPath}: ${label}`);
  assert(homeData.includes(href), `Missing CTA href in ${homeDataPath}: ${href}`);
}

for (const { company, role, dateRange } of recentExperience) {
  assert(experienceData.includes(company), `Missing recent experience company: ${company}`);
  assert(experienceData.includes(role), `Missing recent experience role: ${role}`);
  assert(experienceData.includes(dateRange), `Missing recent experience dates: ${dateRange}`);
}

const principleMatches = homeData.match(/^\s+title: "/gm) ?? [];
assert(
  principleMatches.length >= leadershipPrinciples.length,
  "Expected leadership principles to be represented as typed items"
);

for (const principle of leadershipPrinciples) {
  assert(homeData.includes(principle), `Missing leadership principle: ${principle}`);
}

assert(
  marineCorpsLeadershipPattern.test(homeData),
  "Expected one leadership principle sentence to translate Marine Corps influence into civilian terms"
);

assert(
  homeData.includes("leadershipPrinciples") && homePage.includes("leadershipPrinciples"),
  "Expected homepage to render the How I Lead leadership principles"
);
assert(
  homeData.includes("recentExperience") &&
    homeData.includes("experiencePreview") &&
    homePage.includes("recentExperience"),
  "Expected homepage to render compact Recent Experience rows from shared experience data"
);
assert(
  homeData.includes("closingCtas") && homePage.includes("closingCtas"),
  "Expected homepage to render focused closing CTAs"
);
assert(
  blockedProjectMarkers.every((marker) => !homePage.includes(marker)),
  "Expected projects to stay off the homepage"
);

console.log("Issue #4 homepage recruiter path checks passed.");
