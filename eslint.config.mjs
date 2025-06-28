import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "indent": ["error", 2],
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "no-trailing-spaces": "error",
      "space-before-blocks": "error",
      "space-in-parens": ["error", "never"],
      "space-infix-ops": "error",
      "keyword-spacing": ["error", { "before": true, "after": true }],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off"
    },
  }
]);
