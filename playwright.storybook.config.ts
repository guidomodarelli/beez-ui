/** Verifies the built catalog independently of application-specific browser fixtures. */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/storybook",
  timeout: 120_000,
  use: { baseURL: "http://127.0.0.1:6007" },
  // Started through `node`, not `pnpm exec`, so the server stops with the run on Linux too.
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --outDir storybook-static --host 127.0.0.1 --port 6007 --strictPort",
    port: 6007,
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
