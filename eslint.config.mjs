import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import prettier from "eslint-plugin-prettier";
import eslintPluginImport from "eslint-plugin-import";

// parsers
const tsParser = tseslint.parser;

const astroParser = astro.parser;
export default defineConfig([
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Base configs
  js.configs.recommended,
  tseslint.configs.recommended,

  // Prettier config
  {
    plugins: {
      prettier: prettier,
      import: eslintPluginImport,
    },
    rules: {
      // disable warnings, since prettier should format on save
      "prettier/prettier": "off",
      "no-descending-specificity": "off",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: "const",
        },
        {
          blankLine: "always",
          prev: "import",
          next: "*",
        },
        {
          blankLine: "never",
          prev: "import",
          next: "import",
        },
      ],
    },
  },

  // astro setup with a11y
  astro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".astro"],
        sourceType: "module",
        ecmaVersion: "latest",
        project: "./tsconfig.json",
      },
    },
    rules: {
      "astro/no-conflict-set-directives": "error",
      "astro/no-unused-define-vars-in-style": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          pathGroups: [
            {
              pattern: "@/assets/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/components/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/constants/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/elements/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/layouts/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/styles/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin", "external"],
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
]);
