/** Applies TypeScript checks to maintained code and extracted component sources. */
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["node_modules/**", "storybook-static/**", "coverage/**", "dist/**", "releases/**", ".package-test-*/**", "test-results/**", "tests/next-app/.next/**", "tests/next-app/next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
);
