import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "build",
      "public",
      "coverage",
      ".kiro",
      "node_modules",
      "**/*.md",
      "package-lock.json",
      "package.json",
      "postcss.config.js",
      "tailwind.config.ts",
      // Supabase Edge Functions run in Deno, not the browser. They
      // have their own type system, `deno-lint-ignore` directives, and
      // remote-URL imports (esm.sh / deno.land) that TS-ESLint can't
      // resolve — running the browser lint rules on them just noise.
      "supabase/functions/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
