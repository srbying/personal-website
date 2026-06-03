import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import siteConfig from "./src/data/siteConfig.json" with { type: "json" };

export default defineConfig({
  site: siteConfig.siteUrl,
  integrations: [mdx()],
  output: "static"
});
