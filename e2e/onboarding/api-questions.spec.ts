import { test, expect } from "@playwright/test";
import { API_URL, EXPECTED_COUNTS, FLOW_IDS } from "./helpers";

test.describe("GET /api/onboarding/questions", () => {
  for (const [label, flowId] of [
    ["FIXED_V1", FLOW_IDS.FIXED_V1],
    ["SHORT_IQ_V1", FLOW_IDS.SHORT_IQ_V1],
    ["IQSCALE_V1", FLOW_IDS.IQSCALE_V1],
    ["LIFE_SCALE_888", FLOW_IDS.LIFE_SCALE_888],
    ["LIFE_SCALE_888_TT", FLOW_IDS.LIFE_SCALE_888_TT],
  ] as const) {
    test(`${label} returns seeded questions`, async ({ request }) => {
      const res = await request.get(
        `${API_URL}/api/onboarding/questions?flow=${encodeURIComponent(flowId)}`,
      );
      expect(res.ok(), await res.text()).toBeTruthy();
      const body = await res.json();
      expect(body.flow?.id).toBe(flowId);
      expect(Array.isArray(body.questions)).toBeTruthy();
      expect(body.questions.length).toBe(EXPECTED_COUNTS[flowId]);
      for (const q of body.questions) {
        expect(q.prompt, `question ${q.id} missing prompt`).toBeTruthy();
        expect(q.type, `question ${q.id} missing type`).toBeTruthy();
        expect(q).not.toHaveProperty("correctAnswer");
      }
    });
  }
});
