// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL,
  base: "/",
  server: {
    port: 4000,
  },
  output: "static",
  redirects: {
    "/ja": "/",
    "/about": "/",
    "/concept": "/",
    "/works": "/projects",
    "/ja/about": "/",
    "/ja/concept": "/",
    "/ja/works": "/projects",
    "/ja/contact": "/contact",
  },
});
