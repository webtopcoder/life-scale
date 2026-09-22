import { test, expect, type Page } from "@playwright/test";
import { EXPECTED_COUNTS, FLOW_IDS } from "./helpers";

type FlowCase = {
  name: string;
  path: string;
  /** How to leave the intro screen */
  start: "gender-male" | "start";
  expectedTotal: number;
};

const cases: FlowCase[] = [
  {
    name: "/onboarding (FIXED_V1)",
    path: "/onboarding",
    start: "gender-male",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.FIXED_V1],
  },
  {
    name: "/onboarding-home (ALT → FIXED)",
    path: "/onboarding-home",
    start: "gender-male",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.FIXED_V1],
  },
  {
    name: "/onboarding-plans (PLANS → FIXED)",
    path: "/onboarding-plans",
    start: "gender-male",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.FIXED_V1],
  },
  {
    name: "/onboarding-boa (FIXED_V1)",
    path: "/onboarding-boa",
    start: "gender-male",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.FIXED_V1],
  },
  {
    name: "/onboarding-rvr (FIXED_V1)",
    path: "/onboarding-rvr",
    start: "gender-male",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.FIXED_V1],
  },
  {
    name: "/short-iq (SHORT_IQ_V1)",
    path: "/short-iq",
    start: "start",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.SHORT_IQ_V1],
  },
  {
    name: "/preview/iq-start (IQSCALE_V1)",
    path: "/preview/iq-start",
    start: "start",
    expectedTotal: EXPECTED_COUNTS[FLOW_IDS.IQSCALE_V1],
  },
];

async function startAssessment(page: Page, start: FlowCase["start"]) {
  if (start === "gender-male") {
    await page.getByTestId("intro-gender-male").click();
  } else {
    await page.getByTestId("intro-start").click();
  }
}

test.describe("Public onboarding flows load questions", () => {
  for (const c of cases) {
    test(c.name, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      });

      const questionsResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/onboarding/questions") &&
          res.request().method() === "GET",
        { timeout: 45_000 },
      );

      await page.goto(c.path);

      const apiRes = await questionsResponsePromise;
      expect(
        apiRes.ok(),
        `onboarding questions HTTP ${apiRes.status()} for ${c.path}`,
      ).toBeTruthy();
      const body = await apiRes.json();
      expect(body.questions?.length).toBe(c.expectedTotal);

      if (c.start === "gender-male") {
        await expect(page.getByTestId("intro-gender-male")).toBeVisible();
      } else {
        await expect(page.getByTestId("intro-start")).toBeVisible();
      }

      await startAssessment(page, c.start);

      await expect(page.getByTestId("assessment-root")).toBeVisible();
      const progress = page.getByTestId("assessment-progress");
      await expect(progress).toBeVisible();
      await expect(progress).toContainText(String(c.expectedTotal));
      await expect(progress).toContainText("1");
    });
  }
});
