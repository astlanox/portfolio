import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginImport from "eslint-plugin-import";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    plugins: {
      import: eslintPluginImport,
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
            "type",
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
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
];
