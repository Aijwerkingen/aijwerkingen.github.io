import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ADR-008: brand name/domain must live only in src/site.config.ts. Banned
// literals also include the purged platform references (PENDING-FIXES.md
// P1-13.6) so they can't silently come back in app code.
const bannedLiteralPattern =
  "aijwerkingen|AIjwerkingen|AISafetyWatch|aisafetywatch|AMC-Larebish|github\\.io|lareb|vaers|faers|vigiaccess|mothertobaby|otis|uppsala|mhra";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${bannedLiteralPattern}/i]`,
          message:
            "Brand name/domain and purged platform references must not be hard-coded - use src/site.config.ts (ADR-008) or see PENDING-FIXES.md P1-13.",
        },
      ],
    },
  },
  {
    // site.config.ts is the one place these literals are allowed (ADR-008);
    // this file itself needs to spell out the banned literals to match on them.
    files: ["src/site.config.ts", "eslint.config.mjs"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
