import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://stevenbyington.me",
  integrations: [mdx()],
  output: "static"
});
