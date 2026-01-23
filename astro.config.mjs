// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL,
  base: "/",
  server: {
    port: 4000,
  },
  output: "static",
  adapter: vercel(),
  integrations: [sitemap()],
});
