import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest config — unit tests only by default.
 *
 * E2E lives in tests/e2e and runs through Playwright (npm run test:e2e),
 * so we exclude it here to keep `npm test` fast and self-contained.
 *
 * setupFiles loads the .env.test stubs so encryption / Clerk / Inngest
 * modules have the env vars they need at import time without polluting
 * the real .env.
 */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/**/*.test.ts", "src/lib/providers.tsx"],
    },
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
