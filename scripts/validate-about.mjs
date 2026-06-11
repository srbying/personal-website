import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import siteConfig from "../src/data/siteConfig.json" with { type: "json" };

const root = process.cwd();

const aboutDataPath = "src/data/about.ts";
const aboutPagePath = "src/pages/about.astro";
const aboutHtmlPath = "dist/about/index.html";
const resumePdfRoute = siteConfig.resumePdfRoute;

const openingCopy = [
  "I'm an Engineering Manager with more than a decade of full-stack engineering experience. I help teams understand the work, the reason behind it, and the path through it. Less noise. More ownership.",
  "For me, engineering leadership runs on trust. Titles do not create it. Consistency does. So does honesty, follow-through, and taking care of your people the way you would want to be taken care of.",
  "That shows up in the day to day: saying what is working and what is not, giving engineers room to do their best work, and making sure the work connects back to why it matters.",
  "I learned that before I ever worked in software. In the Marine Corps, servant leadership was not a framework. It was how things worked. You earned trust by leading from alongside your people, not above them. I've carried that into every team I've been part of."
];

const leadershipBeliefs = [
  {
    title: "Integrity over optics",
    body:
      "I say what I mean and give feedback early. I treat honesty as respect. My job is to give people the clarity and confidence to do great work."
  },
  {
    title: "Trust over oversight",
    body:
      "Smart engineers do their best work with context and room to own decisions. I hire capable people, back their judgment, and clear things out of the way."
  },
  {
    title: "Team health first",
    body:
      "Healthy teams build better software. I fight for clear priorities and protect focus. Engineers should have a voice in the technical work they know needs to happen."
  },
  {
    title: "Always improve",
    body:
      "Systems can get better. Processes can get better. People can too. I care about the unglamorous work, especially fixing broken patterns and paying down debt. I also care about developing people for what comes next."
  }
];

const outsideWorkCopy = [
  "I'm a U.S. Marine Corps veteran, trail runner, and ultramarathoner. The Marines and running both shaped how I lead.",
  "The Marines taught me that leadership is earned through service. You take care of your people, and they take care of the mission.",
  "Running taught me patience. You don't run a marathon on race day. You build toward it week by week, track your progress honestly, and trust the work.",
  "I try to bring that same discipline to team-building. Small improvements add up. So does trust.",
  "Outside of work, I play guitar, am learning mandolin, read when I can, and watch a lot of movies. Magnolia is my favorite. I live in Northeast Ohio with my family, and we spend a lot of time on hikes, at amusement parks, and finding small adventures close to home."
];

const requiredDataSnippets = [
  "AboutPageContent",
  "AboutLeadershipBelief",
  "AboutCta",
  "resumePdf.path",
  'canonicalPath: "/about/"',
  "aboutPage",
  "aboutOpeningParagraphs",
  "aboutLeadershipBeliefs",
  "aboutOutsideWorkParagraphs",
  "aboutClosingCtas"
];

const requiredPageSnippets = [
  "aboutPage",
  "aboutOpeningParagraphs",
  "aboutLeadershipBeliefs",
  "aboutOutsideWorkParagraphs",
  "aboutClosingCtas",
  'download={cta.href === resumePdfRoute ? true : undefined}',
  'data-analytics-location="about_close"'
];

const forbiddenPageSnippets = [
  "<img",
  "<picture",
  "heroLandscape",
  "military visual",
  "personal photo",
  "portrait"
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

function assertNoForbiddenSource(source, filePath) {
  const lowerSource = source.toLowerCase();

  for (const snippet of forbiddenPageSnippets) {
    assert(
      !lowerSource.includes(snippet.toLowerCase()),
      `${filePath} must not include About-only visuals: ${snippet}`
    );
  }
}

function normalizeRenderedText(source) {
  return source
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", "\"")
    .replaceAll("&amp;", "&");
}

assert(existsSync(path.join(root, aboutDataPath)), `Missing ${aboutDataPath}`);
assert(existsSync(path.join(root, aboutPagePath)), `Missing ${aboutPagePath}`);

const [aboutData, aboutPage, packageJsonSource] = await Promise.all([
  readProjectFile(aboutDataPath),
  readProjectFile(aboutPagePath),
  readProjectFile("package.json")
]);

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:about"] === "node scripts/validate-about.mjs",
  "Expected npm run test:about to execute the About validator"
);

for (const snippet of requiredDataSnippets) {
  assert(aboutData.includes(snippet), `Missing About data snippet: ${snippet}`);
}

for (const snippet of requiredPageSnippets) {
  assert(aboutPage.includes(snippet), `Missing About page rendering: ${snippet}`);
}

for (const paragraph of [...openingCopy, ...outsideWorkCopy]) {
  assert(aboutData.includes(paragraph), `Missing exact About copy: ${paragraph}`);
}

for (const { title, body } of leadershipBeliefs) {
  assert(aboutData.includes(title), `Missing About leadership title: ${title}`);
  assert(aboutData.includes(body), `Missing About leadership body: ${body}`);
}

assertNoForbiddenSource(aboutData, aboutDataPath);
assertNoForbiddenSource(aboutPage, aboutPagePath);

assert(existsSync(path.join(root, aboutHtmlPath)), `Missing built About page: ${aboutHtmlPath}`);
const aboutHtml = await readProjectFile(aboutHtmlPath);
const aboutMainHtml = aboutHtml.match(/<main\b[\s\S]*<\/main>/)?.[0] ?? aboutHtml;
const aboutMainText = normalizeRenderedText(aboutMainHtml);

assert(aboutMainHtml.includes("<h1"), "Expected About HTML to include one page h1");
assert(
  (aboutMainHtml.match(/<h1\b/g) ?? []).length === 1,
  "Expected About HTML to include exactly one h1"
);
assert(
  aboutMainText.includes("I think in miles, not sprints."),
  "Expected About hook headline"
);
assert(aboutMainText.includes("How I Lead"), "Expected How I Lead section heading");
assert(aboutMainText.includes("Outside the Work"), "Expected Outside the Work section heading");
assert(aboutMainText.includes("more than a decade"), "Expected supplied decade phrasing");
assert(aboutMainText.includes("I'm") && aboutMainText.includes("I've"), "Expected contractions to remain");

for (const paragraph of [...openingCopy, ...outsideWorkCopy]) {
  assert(aboutMainText.includes(paragraph), `Built About page missing exact copy: ${paragraph}`);
}

for (const { title, body } of leadershipBeliefs) {
  assert(aboutMainText.includes(title), `Built About page missing leadership title: ${title}`);
  assert(aboutMainText.includes(body), `Built About page missing leadership body: ${body}`);
}

assertInOrder(
  aboutMainText,
  ["Download My Resume", "Contact Steven"],
  "Expected About close CTA order: Download My Resume, Contact Steven"
);
assert(aboutMainHtml.includes(`href="${resumePdfRoute}"`), "Expected About resume CTA href");
assert(aboutMainHtml.includes(`href="/contact/"`), "Expected About contact CTA href");
assert(aboutMainHtml.includes("download"), "Expected About resume CTA to preserve download behavior");
assert(
  aboutMainHtml.includes('data-analytics-event="resume_download"') &&
    aboutMainHtml.includes('data-analytics-event="contact_click"') &&
    aboutMainHtml.includes('data-analytics-location="about_close"'),
  "Expected About close analytics events"
);

assertNoForbiddenSource(aboutMainHtml, aboutHtmlPath);

console.log("Issue #25 About route checks passed.");
