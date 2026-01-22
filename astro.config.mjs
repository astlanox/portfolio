// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL,
  base: "/",
  server: {
    port: 4000,
  },
  output: "static",
  adapter: vercel(),
  redirects: {
    "/ja": "/",
    "/about": "/",
    "/about/": "/",
    "/concept": "/",
    "/concept/": "/",
    "/works": "/projects",
    "/works/": "/projects",
    "/ja/about": "/",
    "/ja/about/": "/",
    "/ja/concept": "/",
    "/ja/concept/": "/",
    "/ja/works": "/projects",
    "/ja/works/": "/projects",
    "/ja/contact": "/contact",
    "/ja/contact/": "/contact",
  },
});
