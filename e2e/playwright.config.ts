import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(root, "..", ".env.e2e") });
dotenv.config({ path: path.join(root, "..", ".env") });

const baseURL = process.env.E2E_BASE_URL || "http://localhost:8080";

/**
 * Local smoke tests. Start Nest (`npm run api:dev`) and Vite (`npm run dev`)
 * before running — no webServer auto-start.
 */
export default defineConfig({
  testDir: path.join(root),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
