import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import siteConfig from "../src/data/siteConfig.json" with { type: "json" };

const root = process.cwd();
const { siteUrl, resumePdfRoute } = siteConfig;
const openGraphImage = `${siteUrl}/assets/brand/open-graph.png`;
const aboutRoute = "/about/";
const aboutTitle = "About | Steven Byington";
const aboutDescription =
  "About Steven Byington's engineering leadership, full-stack experience, Marine Corps foundation, and personal operating style.";
const usStateAbbreviationPattern =
  "A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]";

const htmlPages = [
  {
    filePath: "dist/index.html",
    path: "/",
    title: "Steven Byington | Software Engineering Manager",
    description:
      "Software Engineering Manager with full-stack depth, product-minded leadership, and a USMC leadership foundation.",
    expectsStructuredData: true
  },
  {
    filePath: "dist/about/index.html",
    path: aboutRoute,
    title: aboutTitle,
    description: aboutDescription
  },
  {
    filePath: "dist/experience/index.html",
    path: "/experience/",
    title: "Experience | Steven Byington",
    description:
      "Steven Byington's professional experience, role progression, selected impact, technical depth, and military service."
  },
  {
    filePath: "dist/projects/index.html",
    path: "/projects/",
    title: "Projects | Steven Byington",
    description:
      "Selected projects by Steven Byington, including Aeris fitness analytics and SoilOS lawn-care planning."
  },
  {
    filePath: "dist/projects/aeris/index.html",
    path: "/projects/aeris/",
    title: "Aeris | Steven Byington",
    description:
      "A personal fitness analytics tool for understanding speed and fitness progress through trends, comparisons, and progress insights."
  },
  {
    filePath: "dist/projects/soilos/index.html",
    path: "/projects/soilos/",
    title: "SoilOS | Steven Byington",
    description:
      "A personal lawn-care planning app using local weather, soil data, seasonal tasks, budget tracking, and progress photos to support a practical multi-year plan."
  },
  {
    filePath: "dist/resume/index.html",
    path: "/resume/",
    title: "Resume | Steven Byington",
    description:
      "HTML resume for Steven Byington, Software Engineering Manager with full-stack product engineering, leadership, and military experience."
  },
  {
    filePath: "dist/contact/index.html",
    path: "/contact/",
    title: "Contact | Steven Byington",
    description:
      "Public contact links for Steven Byington, including email, LinkedIn, GitHub, and resume."
  }
];

const expectedSitemapPaths = [
  "/",
  "/about/",
  "/experience/",
  "/projects/",
  "/projects/aeris/",
  "/projects/soilos/",
  "/resume/",
  "/contact/",
  resumePdfRoute
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readProjectFile(filePath) {
  return readFile(path.join(root, filePath), "utf8");
}

function absoluteUrl(routePath) {
  return new URL(routePath, siteUrl).href;
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

function normalizePrivacySource(source) {
  return source
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertNoPrivateLocationOrPhone(source, label) {
  const normalizedSource = normalizePrivacySource(source);

  assert(!/\btel:/i.test(source), `${label} must not expose telephone links`);
  assert(
    !/(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}/.test(
      normalizedSource
    ),
    `${label} must not expose phone-number-like text`
  );
  assert(
    !/\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way)\b/i.test(
      normalizedSource
    ),
    `${label} must not expose street-address-like text`
  );
  assert(
    !new RegExp(
      `\\b[A-Z][A-Za-z.'-]+(?:\\s+[A-Z][A-Za-z.'-]+){0,2},\\s+(?:${usStateAbbreviationPattern})\\b`
    ).test(normalizedSource),
    `${label} must not expose city-and-state-style text`
  );
}

function assertMeta(html, name, content) {
  assert(
    html.includes(`<meta name="${name}" content="${content}">`),
    `Expected meta ${name}: ${content}`
  );
}

function assertProperty(html, property, content) {
  assert(
    html.includes(`<meta property="${property}" content="${content}">`),
    `Expected property ${property}: ${content}`
  );
}

function assertHeadMetadata(page, html) {
  const pageUrl = absoluteUrl(page.path);

  assert(
    html.includes(`<title>${page.title}</title>`),
    `Expected title for ${page.path}: ${page.title}`
  );
  assertMeta(html, "description", page.description);
  assert(
    html.includes(`<link rel="canonical" href="${pageUrl}">`),
    `Expected canonical for ${page.path}: ${pageUrl}`
  );
  assertProperty(html, "og:locale", "en_US");
  assertProperty(html, "og:site_name", "Steven Byington");
  assertProperty(html, "og:title", page.title);
  assertProperty(html, "og:description", page.description);
  assertProperty(html, "og:type", "website");
  assertProperty(html, "og:url", pageUrl);
  assertProperty(html, "og:image", openGraphImage);
  assertProperty(html, "og:image:alt", "Steven Byington social preview");
  assertProperty(html, "og:image:width", "1200");
  assertProperty(html, "og:image:height", "630");
  assert(
    !html.includes("og:type\" content=\"article") &&
      !html.includes("property=\"article:") &&
      !html.includes("BlogPosting"),
    `Expected no blog/article metadata for ${page.path}`
  );
}

function extractJsonLd(html) {
  const match = html.match(
    /<script type="application\/ld\+json">(?<json>.*?)<\/script>/s
  );

  assert(match?.groups?.json, "Expected JSON-LD script on the home page");

  return JSON.parse(match.groups.json);
}

for (const page of htmlPages) {
  assert(existsSync(path.join(root, page.filePath)), `Missing built page: ${page.filePath}`);
  const html = await readProjectFile(page.filePath);

  assertHeadMetadata(page, html);

  const privateSource = html.replaceAll("United States Marine Corps", "");
  assertNoPrivateLocationOrPhone(privateSource, `Public SEO HTML for ${page.path}`);
}

const homeHtml = await readProjectFile("dist/index.html");
const structuredData = extractJsonLd(homeHtml);

assert(structuredData["@context"] === "https://schema.org", "Expected schema.org context");
assert(structuredData["@type"] === "Person", "Expected Person JSON-LD");
assert(structuredData.name === "Steven Byington", "Expected JSON-LD person name");
assert(structuredData.url === siteUrl, "Expected JSON-LD canonical URL");
assert(
  structuredData.jobTitle === "Software Engineering Manager",
  "Expected conservative JSON-LD job title"
);
assert(
  Array.isArray(structuredData.sameAs) &&
    structuredData.sameAs.length === 2 &&
    structuredData.sameAs.includes("https://www.linkedin.com/in/stevenbyington/") &&
    structuredData.sameAs.includes("https://github.com/srbying"),
  "Expected JSON-LD sameAs with only LinkedIn and GitHub"
);

for (const forbiddenKey of ["email", "telephone", "address", "homeLocation", "birthPlace"]) {
  assert(!(forbiddenKey in structuredData), `JSON-LD must not expose ${forbiddenKey}`);
}

assert(existsSync(path.join(root, "dist/sitemap.xml")), "Missing generated sitemap.xml");
const sitemap = await readProjectFile("dist/sitemap.xml");
const aboutSitemapUrl = `<loc>${absoluteUrl(aboutRoute)}</loc>`;

for (const routePath of expectedSitemapPaths) {
  assert(
    sitemap.includes(`<loc>${absoluteUrl(routePath)}</loc>`),
    `Sitemap missing route: ${routePath}`
  );
}

assert(
  countOccurrences(sitemap, aboutSitemapUrl) === 1,
  "Sitemap must include the About route exactly once"
);
assert(!sitemap.includes("/404"), "Sitemap must not include 404 route");
assert(!sitemap.includes("/blog"), "Sitemap must not include blog routes before Writing exists");

assert(existsSync(path.join(root, "dist/robots.txt")), "Missing generated robots.txt");
const robots = await readProjectFile("dist/robots.txt");

assert(robots.includes("User-agent: *"), "robots.txt missing default user-agent");
assert(robots.includes("Allow: /"), "robots.txt must allow launch content");
assert(
  robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`),
  "robots.txt missing sitemap URL"
);
assert(
  !robots.includes("Disallow: /"),
  "robots.txt must not block intended launch content"
);

const notFound = await readProjectFile("dist/404.html");
assert(
  notFound.includes('<meta name="robots" content="noindex, follow">'),
  "404 page must remain noindex"
);

assert(existsSync(path.join(root, `public${resumePdfRoute}`)), "Missing public Resume PDF");
assert(existsSync(path.join(root, `dist${resumePdfRoute}`)), "Missing built Resume PDF");

const [validatorSource, siteData, aboutData, aboutPageSource, sitemapSource] =
  await Promise.all([
    readProjectFile("scripts/validate-seo.mjs"),
    readProjectFile("src/data/site.ts"),
    readProjectFile("src/data/about.ts"),
    readProjectFile("src/pages/about.astro"),
    readProjectFile("src/pages/sitemap.xml.ts")
  ]);

const launchRoutesBlock =
  siteData.match(/export const launchRoutes = \[[\s\S]*?\] as const;/)?.[0] ?? "";

assert(
  launchRoutesBlock.includes(`"${aboutRoute}"`),
  "Shared launchRoutes must include the About route"
);
assertInOrder(
  launchRoutesBlock,
  ['"/"', `"${aboutRoute}"`, '"/experience/"'],
  "Shared launchRoutes must keep About between Home and Experience"
);
assert(
  siteData.includes("export const sitemapRoutes = [...launchRoutes, resumePdfRoute] as const;"),
  "Shared sitemapRoutes must derive from launchRoutes and resumePdfRoute"
);
assert(
  aboutData.includes(`canonicalPath: "${aboutRoute}"`) &&
    aboutData.includes(`title: "About"`) &&
    aboutData.includes(aboutDescription),
  "About data must keep page-specific title, description, and canonical route"
);
assert(
  aboutPageSource.includes("canonicalPath={aboutPage.canonicalPath}"),
  "About page must pass shared canonicalPath into BaseLayout"
);
assert(
  sitemapSource.includes("sitemapRoutes") &&
    sitemapSource.includes("toAbsoluteUrl") &&
    !sitemapSource.includes(siteUrl),
  "Sitemap route generation must use shared sitemapRoutes and toAbsoluteUrl"
);
assert(
  !/const\s+siteUrl\s*=\s*["']https:/.test(validatorSource),
  "SEO validator must import siteUrl from shared config"
);
assert(
  !/const\s+resumePdf(?:Path|Route)\s*=\s*["']\/resume\//.test(validatorSource),
  "SEO validator must import the resume PDF route from shared config"
);

console.log("Issue #10 SEO metadata checks passed.");
