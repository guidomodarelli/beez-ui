/** Covers desktop and small-screen rendering in both supported engines. */
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://127.0.0.1:3108" },
  timeout: 60000,
  webServer: [
    { command: "pnpm exec vite --config tests/browser/vite.config.ts", port: 3108, reuseExistingServer: false },
    { command: "pnpm exec next dev tests/next-app --port 3109", port: 3109, reuseExistingServer: false, timeout: 120000 },
  ],
  projects: [
    { name: "chromium-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "chromium-mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "webkit-desktop", use: { browserName: "webkit", viewport: { width: 1440, height: 1000 } } },
    { name: "webkit-mobile", use: { browserName: "webkit", viewport: { width: 390, height: 844 } } },
  ],
});
