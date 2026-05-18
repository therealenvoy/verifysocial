import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — e2e suite at tests/e2e/, runs against npm run start.
 *
 * CI provisions a dev DB and starts the app on port 3000 before the e2e
 * run; locally `npm run test:e2e` does the same via webServer. We pin to
 * Chromium for Phase 1 — Firefox / WebKit added when there's a real
 * cross-browser bug to chase.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
