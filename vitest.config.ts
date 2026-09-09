/** Configures real component tests using the same public barrel as consumers. */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Reuse environment initialization while preserving a separate VM per test file.
    pool: "vmThreads",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
