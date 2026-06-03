import type { APIRoute } from "astro";
import { toAbsoluteUrl } from "../data/site";

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${toAbsoluteUrl("/sitemap.xml")}
`;

export const GET: APIRoute = () =>
  new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
