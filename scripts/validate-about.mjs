import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import siteConfig from "../src/data/siteConfig.json" with { type: "json" };

const root = process.cwd();

const aboutDataPath = "src/data/about.ts";
const aboutPagePath = "src/pages/about.astro";
const globalStylesPath = "src/styles/global.css";
const aboutHtmlPath = "dist/about/index.html";
const resumePdfRoute = siteConfig.resumePdfRoute;

const aboutSectionIds = [
  "about-title",
  "about-leadership-heading",
  "about-outside-work-heading",
  "about-close-heading"
];

const expectedHeadingOutline = [
  { level: 1, text: "I think in miles, not sprints." },
  { level: 2, text: "How I Lead" },
  { level: 3, text: "Integrity over optics" },
  { level: 3, text: "Trust over oversight" },
  { level: 3, text: "Team health first" },
  { level: 3, text: "Always improve" },
  { level: 2, text: "Outside the Work" },
  { level: 2, text: "Want the concise version?" }
];

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
  "Outside of work, I play guitar, wanting to learn mandolin, read when I can, and watch a lot of movies. Magnolia is my favorite. I live in Northeast Ohio with my family, and we spend a lot of time on hikes, at amusement parks, and finding small adventures close to home."
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
  "<svg",
  "heroLandscape",
  "military visual",
  "personal photo",
  "portrait",
  "runner visual",
  "badge grid",
  "project promotion"
];

const requiredOutsideWorkPrivacySnippets = [
  "Northeast Ohio with my family"
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

function countOccurrences(source, snippet) {
  return source.split(snippet).length - 1;
}

function getOpeningTags(source, tagName) {
  return source.match(new RegExp(`<${tagName}\\b[^>]*>`, "g")) ?? [];
}

function getAttribute(openingTag, name) {
  return openingTag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
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

function assertNoPrivateDetails(source, label, { requiresApprovedNote = true } = {}) {
  const normalizedSource = normalizeRenderedText(source);
  const visibleText = normalizeText(normalizedSource);
  const approvedHomeNote = requiredOutsideWorkPrivacySnippets[0];
  const homeLocationStatements =
    visibleText.match(/\b(?:I live in|based in|located in|home in)\s+[^.]+/gi) ?? [];

  assert(!/\btel:/i.test(normalizedSource), `${label} must not expose telephone links`);
  assert(
    !/(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}/.test(visibleText),
    `${label} must not expose phone-number-like text`
  );
  assert(
    !/\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way)\b/i.test(
      visibleText
    ),
    `${label} must not expose street-address-like text`
  );
  assert(
    homeLocationStatements.every((statement) => statement.includes(approvedHomeNote)),
    `${label} must only use the approved broad home-location note`
  );
  if (requiresApprovedNote) {
    assert(
      countOccurrences(visibleText, approvedHomeNote) === 1,
      `${label} must include the approved personal note exactly once`
    );
    assert(
      countOccurrences(visibleText.toLowerCase(), "family") === 1,
      `${label} must not expand beyond the approved family note`
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

function normalizeText(source) {
  return normalizeRenderedText(source.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getHeadingOutline(source) {
  return Array.from(source.matchAll(/<h([1-6])\b[^>]*>(?<content>[\s\S]*?)<\/h\1>/g)).map(
    (match) => ({
      level: Number(match[1]),
      text: normalizeText(match.groups.content)
    })
  );
}

function assertExpectedHeadingOutline(source, label) {
  const headings = getHeadingOutline(source);

  assert(
    headings.length === expectedHeadingOutline.length,
    `${label} must render exactly the expected About headings`
  );

  for (const [index, expectedHeading] of expectedHeadingOutline.entries()) {
    const actualHeading = headings[index];

    assert(
      actualHeading.level === expectedHeading.level &&
        actualHeading.text === expectedHeading.text,
      `${label} heading ${index + 1} expected h${expectedHeading.level} "${expectedHeading.text}", got h${actualHeading.level} "${actualHeading.text}"`
    );
  }

  assert(
    headings.every((heading, index) => {
      if (index === 0) {
        return heading.level === 1;
      }

      return heading.level <= headings[index - 1].level + 1;
    }),
    `${label} heading order must not skip levels`
  );
}

function findBeliefCards(source) {
  return source.match(/<li class="[^"]*\babout-belief-card\b[^"]*">[\s\S]*?<\/li>/g) ?? [];
}

function assertTextLedBeliefCards(cards) {
  assert(
    cards.length === leadershipBeliefs.length,
    "Expected About HTML to render exactly four leadership belief cards"
  );

  for (const card of cards) {
    assert((card.match(/<h3\b/g) ?? []).length === 1, "Expected each belief card to include one h3");
    assert((card.match(/<p\b/g) ?? []).length === 1, "Expected each belief card to include one body paragraph");
    assert(
      !/<(?:img|picture|svg)\b/i.test(card),
      "Leadership belief cards must stay text-led without icons or visual assets"
    );
    assert(
      !/\b(?:badge|icon)\b/i.test(card),
      "Leadership belief cards must not use badge or icon treatment"
    );
  }
}

function findAnchors(source) {
  return Array.from(source.matchAll(/<a\b(?<attrs>[^>]*)>(?<content>[\s\S]*?)<\/a>/g)).map(
    (match) => ({
      attrs: match.groups.attrs,
      text: normalizeText(match.groups.content)
    })
  );
}

function findAnchorByText(source, text) {
  return findAnchors(source).find((anchor) => anchor.text === text);
}

function assertFocusableAnchor(anchor, label) {
  assert(anchor, `Expected focusable About CTA: ${label}`);
  assert(getAttribute(`<a${anchor.attrs}>`, "href"), `Expected ${label} CTA to include href`);
  assert(!/\sdisabled(?:\s|>|=)/i.test(anchor.attrs), `${label} CTA must not be disabled`);
  assert(!/\sinert(?:\s|>|=)/i.test(anchor.attrs), `${label} CTA must not be inert`);
  assert(!/\saria-hidden="true"/i.test(anchor.attrs), `${label} CTA must not be hidden from assistive tech`);
  assert(!/\stabindex="-1"/i.test(anchor.attrs), `${label} CTA must remain keyboard focusable`);
}

function assertRestrainedBeliefCardStyles(styles) {
  const cardRule = styles.match(/\.about-belief-card\s*\{[\s\S]*?\}/)?.[0] ?? "";

  assert(cardRule, "Expected About leadership card styles");
  assert(
    !/(?:box-shadow|background-image|linear-gradient|radial-gradient|filter:)/i.test(cardRule),
    "About leadership cards must avoid loud decorative styling"
  );
}

function assertAboutSectionStructure(source, label) {
  const sections = getOpeningTags(source, "section");
  const labelledSectionIds = sections
    .map((section) => getAttribute(section, "aria-labelledby"))
    .filter(Boolean);

  assert(
    labelledSectionIds.length === aboutSectionIds.length,
    `${label} must include four labelled semantic About sections`
  );

  assert(
    labelledSectionIds.every((id, index) => id === aboutSectionIds[index]),
    `${label} section order must be opening, leadership, outside-work, close`
  );

  for (const id of aboutSectionIds) {
    assert(source.includes(`id="${id}"`), `${label} missing heading target: ${id}`);
  }
}

function assertAboutResponsiveStyles(styles) {
  assert(
    /\.about-belief-card\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?\}/.test(styles),
    "About leadership cards must be allowed to shrink without overflow"
  );
  assert(
    /@media\s*\(max-width:\s*520px\)\s*\{[\s\S]*?\.about-belief-list\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?\}[\s\S]*?\}/.test(styles),
    "About leadership cards must collapse to one column on small mobile"
  );
  assert(
    /@media\s*\(max-width:\s*520px\)\s*\{[\s\S]*?\.about-belief-card\s*\{[\s\S]*?min-height:\s*auto;[\s\S]*?\}[\s\S]*?\}/.test(styles),
    "About leadership cards must remove fixed min-height on small mobile"
  );
  assert(
    /@media\s*\(max-width:\s*840px\)\s*\{[\s\S]*?\.about-close\s*\{[\s\S]*?flex-direction:\s*column;[\s\S]*?\}[\s\S]*?\}/.test(styles),
    "About close CTAs must stack on mobile"
  );
}

assert(existsSync(path.join(root, aboutDataPath)), `Missing ${aboutDataPath}`);
assert(existsSync(path.join(root, aboutPagePath)), `Missing ${aboutPagePath}`);
assert(existsSync(path.join(root, globalStylesPath)), `Missing ${globalStylesPath}`);

const [aboutData, aboutPage, globalStyles, packageJsonSource] = await Promise.all([
  readProjectFile(aboutDataPath),
  readProjectFile(aboutPagePath),
  readProjectFile(globalStylesPath),
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

for (const snippet of requiredOutsideWorkPrivacySnippets) {
  assert(aboutData.includes(snippet), `Missing About privacy-safe wording: ${snippet}`);
}

for (const { title, body } of leadershipBeliefs) {
  assert(aboutData.includes(title), `Missing About leadership title: ${title}`);
  assert(aboutData.includes(body), `Missing About leadership body: ${body}`);
}

assertNoForbiddenSource(aboutData, aboutDataPath);
assertNoForbiddenSource(aboutPage, aboutPagePath);
assertNoPrivateDetails(aboutData, aboutDataPath);
assertNoPrivateDetails(aboutPage, aboutPagePath, { requiresApprovedNote: false });
assertAboutSectionStructure(aboutPage, aboutPagePath);
assertRestrainedBeliefCardStyles(globalStyles);
assertAboutResponsiveStyles(globalStyles);

assert(existsSync(path.join(root, aboutHtmlPath)), `Missing built About page: ${aboutHtmlPath}`);
const aboutHtml = await readProjectFile(aboutHtmlPath);
const aboutMainHtml = aboutHtml.match(/<main\b[\s\S]*<\/main>/)?.[0] ?? aboutHtml;
const aboutMainText = normalizeRenderedText(aboutMainHtml);
const renderedBeliefCards = findBeliefCards(aboutMainHtml);
const resumeCta = findAnchorByText(aboutMainHtml, "Download My Resume");
const contactCta = findAnchorByText(aboutMainHtml, "Contact Steven");

assert(aboutMainHtml.includes("<h1"), "Expected About HTML to include one page h1");
assert(
  (aboutMainHtml.match(/<h1\b/g) ?? []).length === 1,
  "Expected About HTML to include exactly one h1"
);
assertAboutSectionStructure(aboutMainHtml, aboutHtmlPath);
assertExpectedHeadingOutline(aboutMainHtml, aboutHtmlPath);
assert(
  aboutMainText.includes("I think in miles, not sprints."),
  "Expected About hook headline"
);
assert(aboutMainText.includes("How I Lead"), "Expected How I Lead section heading");
assert(aboutMainText.includes("Outside the Work"), "Expected Outside the Work section heading");
assert(aboutMainText.includes("more than a decade"), "Expected supplied decade phrasing");
assert(aboutMainText.includes("I'm") && aboutMainText.includes("I've"), "Expected contractions to remain");
assertTextLedBeliefCards(renderedBeliefCards);

for (const paragraph of [...openingCopy, ...outsideWorkCopy]) {
  assert(aboutMainText.includes(paragraph), `Built About page missing exact copy: ${paragraph}`);
}

for (const snippet of requiredOutsideWorkPrivacySnippets) {
  assert(aboutMainText.includes(snippet), `Built About page missing privacy-safe wording: ${snippet}`);
}

for (const { title, body } of leadershipBeliefs) {
  assert(aboutMainText.includes(title), `Built About page missing leadership title: ${title}`);
  assert(aboutMainText.includes(body), `Built About page missing leadership body: ${body}`);
  assert(
    countOccurrences(aboutMainText, title) === 1,
    `Built About page must render leadership title exactly once: ${title}`
  );
  assert(
    countOccurrences(aboutMainText, body) === 1,
    `Built About page must render leadership body exactly once: ${body}`
  );
}

assertInOrder(
  aboutMainText,
  [
    "I think in miles, not sprints.",
    openingCopy[0],
    "How I Lead",
    ...leadershipBeliefs.flatMap(({ title, body }) => [title, body]),
    "Outside the Work",
    ...outsideWorkCopy,
    "Want the concise version?",
    "Download My Resume",
    "Contact Steven"
  ],
  "Expected full About content order: opening, How I Lead, Outside the Work, close"
);
assertFocusableAnchor(resumeCta, "Download My Resume");
assertFocusableAnchor(contactCta, "Contact Steven");
assert(resumeCta.attrs.includes(`href="${resumePdfRoute}"`), "Expected About resume CTA href");
assert(contactCta.attrs.includes('href="/contact/"'), "Expected About contact CTA href");
assert(resumeCta.attrs.includes("download"), "Expected About resume CTA to preserve download behavior");
assert(contactCta.attrs.includes("button-link"), "Expected About contact CTA to use button-link styling");
assert(
  aboutMainHtml.includes('data-analytics-event="resume_download"') &&
    aboutMainHtml.includes('data-analytics-event="contact_click"') &&
    aboutMainHtml.includes('data-analytics-location="about_close"'),
  "Expected About close analytics events"
);

assertNoForbiddenSource(aboutMainHtml, aboutHtmlPath);
assertNoPrivateDetails(aboutMainText, aboutHtmlPath);

console.log("Issue #28 About route, content order, privacy, responsive, and accessibility checks passed.");
