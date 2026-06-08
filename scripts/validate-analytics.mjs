import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "src/env.d.ts",
  "src/layouts/BaseLayout.astro",
  "src/scripts/analytics.ts",
  "src/pages/index.astro",
  "src/pages/resume.astro",
  "src/pages/contact.astro",
  "src/pages/projects.astro",
  "src/pages/projects/[slug].astro",
  "src/components/SiteFooter.astro",
  "docs/analytics-setup.md",
  "package.json"
];

const envVars = [
  "PUBLIC_GA4_MEASUREMENT_ID",
  "PUBLIC_MICROSOFT_CLARITY_PROJECT_ID",
  "PUBLIC_GOOGLE_SITE_VERIFICATION"
];

const eventNames = [
  "resume_view",
  "resume_download",
  "contact_click",
  "email_click",
  "linkedin_click",
  "github_click",
  "impact_click",
  "project_click"
];

const docsRequiredText = [
  "Google Search Console",
  "Google Analytics 4",
  "Microsoft Clarity",
  "free",
  "DNS TXT",
  "HTML meta",
  "sitemap.xml",
  "resume_view",
  "resume_download",
  "contact_click",
  "email_click",
  "linkedin_click",
  "github_click",
  "impact_click",
  "project_click"
];

const distExpectations = [
  {
    filePath: "dist/index.html",
    events: ["resume_download", "impact_click", "contact_click"]
  },
  {
    filePath: "dist/resume/index.html",
    events: ["resume_view", "resume_download", "email_click", "linkedin_click", "github_click"]
  },
  {
    filePath: "dist/contact/index.html",
    events: ["email_click", "linkedin_click", "github_click", "resume_download"]
  },
  {
    filePath: "dist/projects/index.html",
    events: ["project_click", "github_click"]
  },
  {
    filePath: "dist/projects/aeris/index.html",
    events: ["project_click", "github_click"]
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function assertIncludes(source, snippet, message) {
  assert(source.includes(snippet), message ?? `Missing snippet: ${snippet}`);
}

function assertExcludes(source, snippet, message) {
  assert(!source.includes(snippet), message ?? `Unexpected snippet: ${snippet}`);
}

function assertDistEvent(html, eventName, filePath) {
  assert(
    html.includes(`data-analytics-event="${eventName}"`) ||
      html.includes(`data-analytics-page-event="${eventName}"`) ||
      html.includes(`data-analytics-secondary-event="${eventName}"`),
    `${filePath} missing event ${eventName}`
  );
}

for (const filePath of requiredFiles) {
  assert(existsSync(path.join(root, filePath)), `Missing required file: ${filePath}`);
}

const [
  envTypes,
  baseLayout,
  analyticsUtility,
  homePage,
  resumePage,
  contactPage,
  projectsPage,
  projectDetailPage,
  footer,
  docs,
  packageJsonSource
] = await Promise.all(requiredFiles.map(readProjectFile));

const packageJson = JSON.parse(packageJsonSource);

assert(
  packageJson.scripts?.["test:analytics"] === "node scripts/validate-analytics.mjs",
  "Expected npm run test:analytics to execute the analytics validator"
);

for (const envVar of envVars) {
  assertIncludes(envTypes, envVar, `Missing env type for ${envVar}`);
  assertIncludes(baseLayout, envVar, `BaseLayout must read ${envVar}`);
}

assertIncludes(baseLayout, "import.meta.env.PROD", "Analytics must be gated to production");
assertIncludes(baseLayout, "googletagmanager.com/gtag/js", "Missing lightweight GA4 gtag script");
assertIncludes(baseLayout, "google-site-verification", "Missing Google site verification meta support");
assertIncludes(baseLayout, "clarity.ms/tag", "Missing Microsoft Clarity script");
assertExcludes(baseLayout, "googletagmanager.com/gtm.js", "Google Tag Manager must not be added");
assertExcludes(baseLayout, "plausible", "Plausible must not be added");
assertExcludes(baseLayout, "vercel/analytics", "Vercel Analytics must not be added");

for (const eventName of eventNames) {
  assertIncludes(analyticsUtility, eventName, `Analytics utility missing event: ${eventName}`);
}

assertIncludes(analyticsUtility, "window.gtag", "Analytics utility must use GA4 gtag");
assertIncludes(analyticsUtility, "data-analytics-event", "Analytics utility must use delegated data attributes");
assertIncludes(analyticsUtility, "astro:page-load", "Analytics utility must support Astro page-load lifecycle");
assertExcludes(analyticsUtility, "localStorage", "Analytics utility must not persist visitor data");

const sourceWithTrackedLinks = [
  homePage,
  resumePage,
  contactPage,
  projectsPage,
  projectDetailPage,
  footer
].join("\n");

for (const eventName of eventNames) {
  assertIncludes(sourceWithTrackedLinks, eventName, `No tracked link/page source uses ${eventName}`);
}

for (const target of [
  "resume_pdf",
  "linkedin",
  "github",
  "email",
  "aeris",
  "soilos",
  "selected_impact"
]) {
  assertIncludes(sourceWithTrackedLinks, target, `Missing analytics target: ${target}`);
}

for (const location of ["hero", "footer", "resume_page", "project_card"]) {
  assertIncludes(sourceWithTrackedLinks, location, `Missing analytics location: ${location}`);
}

for (const snippet of docsRequiredText) {
  assertIncludes(docs, snippet, `Analytics setup docs missing: ${snippet}`);
}

for (const forbidden of ["Plausible", "Vercel Analytics", "Ahrefs", "trial"]) {
  assertExcludes(docs, forbidden, `Analytics docs must not recommend ${forbidden}`);
}

const hasGaEnv = Boolean(process.env.PUBLIC_GA4_MEASUREMENT_ID);
const hasClarityEnv = Boolean(process.env.PUBLIC_MICROSOFT_CLARITY_PROJECT_ID);
const hasVerificationEnv = Boolean(process.env.PUBLIC_GOOGLE_SITE_VERIFICATION);

for (const { filePath, events } of distExpectations) {
  assert(existsSync(path.join(root, filePath)), `Missing built page: ${filePath}`);
  const html = await readProjectFile(filePath);

  for (const eventName of events) {
    assertDistEvent(html, eventName, filePath);
  }

  if (hasGaEnv) {
    assertIncludes(html, process.env.PUBLIC_GA4_MEASUREMENT_ID, `${filePath} missing GA4 ID`);
    assertIncludes(html, "googletagmanager.com/gtag/js", `${filePath} missing GA4 script`);
  } else {
    assertExcludes(html, "googletagmanager.com/gtag/js", `${filePath} must omit GA4 script without env`);
  }

  if (hasClarityEnv) {
    assertIncludes(html, "clarity.ms/tag", `${filePath} missing Clarity script`);
    assertIncludes(html, process.env.PUBLIC_MICROSOFT_CLARITY_PROJECT_ID, `${filePath} missing Clarity ID`);
  } else {
    assertExcludes(html, "clarity.ms/tag", `${filePath} must omit Clarity without env`);
  }

  if (hasVerificationEnv) {
    assertIncludes(
      html,
      `name="google-site-verification" content="${process.env.PUBLIC_GOOGLE_SITE_VERIFICATION}"`,
      `${filePath} missing Google site verification meta`
    );
  } else {
    assertExcludes(
      html,
      "google-site-verification",
      `${filePath} must omit Google site verification without env`
    );
  }
}

console.log("Analytics and free search-readiness checks passed.");
