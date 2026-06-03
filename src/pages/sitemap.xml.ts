import type { APIRoute } from "astro";
import { sitemapRoutes, toAbsoluteUrl } from "../data/site";

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes
  .map((route) => `  <url>\n    <loc>${toAbsoluteUrl(route)}</loc>\n  </url>`)
  .join("\n")}
</urlset>
`;

export const GET: APIRoute = () =>
  new Response(sitemapXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
