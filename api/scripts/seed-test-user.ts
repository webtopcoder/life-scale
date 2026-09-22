/**
 * Create an auto-confirmed Cognito user + seed complete-tier DB state.
 *
 *   AWS_PROFILE=estrelar npm run db:seed:test-user
 *   AWS_PROFILE=estrelar SEED_TEST_USER_INCLUDE_UPSELLS=1 npm run db:seed:test-user
 *
 * Idempotent: re-running resets password, upserts profile/subscription,
 * and refreshes test_completions. By default clears upsell purchases;
 * set SEED_TEST_USER_INCLUDE_UPSELLS=1|true to grant all three funnel upsells.
 */
import "dotenv/config";
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

const EMAIL =
  process.env.SEED_TEST_USER_EMAIL || "e2e-complete@life-scale.test";
const PASSWORD = process.env.SEED_TEST_USER_PASSWORD || "TestUser123!";
const POOL_ID = process.env.COGNITO_USER_POOL_ID;
const REGION = process.env.COGNITO_REGION || "us-east-1";
const INCLUDE_UPSELLS = ["1", "true", "yes"].includes(
  (process.env.SEED_TEST_USER_INCLUDE_UPSELLS || "").toLowerCase(),
);
const INCLUDE_ADDONS = ["1", "true", "yes"].includes(
  (process.env.SEED_TEST_USER_INCLUDE_ADDONS || "").toLowerCase(),
);
const DISPLAY_NAME = process.env.SEED_TEST_USER_NAME || "E2E Complete";

const UPSELL_PRODUCT_KEYS = [
  "weakness_report",
  "genius_blueprint",
  "brain_coach",
] as const;

/** Every add-on product key in src/lib/addons.ts (5 per live scale). */
const ADDON_PRODUCT_KEYS = [
  // IQ
  "addon_iq_weakness_report",
  "addon_iq_answer_breakdown",
  "addon_iq_speed_accuracy_report",
  "addon_iq_study_work_fit",
  "addon_iq_30day_sharpening",
  // Brain Health
  "addon_brain_sleep_recovery",
  "addon_brain_stress_load",
  "addon_brain_nutrition_movement",
  "addon_brain_focus_energy_map",
  "addon_brain_30day_habit",
  // Hidden Genius
  "addon_genius_archetype_deep_dive",
  "addon_genius_strengths_blind",
  "addon_genius_collaboration",
  "addon_genius_creative_style",
  "addon_genius_30day_practice",
  // Body IQ
  "addon_body_weak_area_deep_dive",
  "addon_body_energy_audit",
  "addon_body_strength_starter",
  "addon_body_your_day_rebuilt",
  "addon_body_30day_planner",
  // Sleep Health
  "addon_sleep_first_week",
  "addon_sleep_daytime_effects",
  "addon_sleep_irregular_hours",
  "addon_sleep_your_night_mapped",
  "addon_sleep_30day_planner",
  // Hidden Athlete
  "addon_athlete_archetype_deep_dive",
  "addon_athlete_recovery_protocol",
  "addon_athlete_benchmark_pack",
  "addon_athlete_training_blueprint",
  "addon_athlete_30day_training",
] as const;


function createPrisma() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");
  const url = raw.replace(/[?&]schema=[^&]*/g, "").replace(/\?$/, "");
  const pool = new Pool({
    connectionString: url,
    ssl:
      url.includes("sslmode=require") || url.includes("rds.amazonaws.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

function attr(
  attrs: { Name?: string; Value?: string }[] | undefined,
  name: string,
): string | undefined {
  return attrs?.find((a) => a.Name === name)?.Value;
}

/** IQ category scores as 0–1 (matches live scoringEngine). */
function iqPayload(): Prisma.InputJsonValue {
  const scores = {
    logic: 0.84,
    pattern: 0.92,
    spatial: 0.79,
    speed: 0.58,
    self: 0.74,
  };
  const percentiles = {
    logic: 91,
    pattern: 96,
    spatial: 88,
    speed: 72,
    self: 85,
  };
  const answerSpecs: Array<{
    category: string;
    correct: boolean;
    timeMs: number;
  }> = [
    { category: "pattern", correct: true, timeMs: 9200 },
    { category: "pattern", correct: true, timeMs: 8400 },
    { category: "logic", correct: true, timeMs: 11800 },
    { category: "logic", correct: true, timeMs: 12500 },
    { category: "spatial", correct: true, timeMs: 14100 },
    { category: "spatial", correct: false, timeMs: 26400 },
    { category: "speed", correct: false, timeMs: 21900 },
    { category: "speed", correct: false, timeMs: 24300 },
    { category: "logic", correct: true, timeMs: 10700 },
    { category: "self", correct: true, timeMs: 4200 },
  ];
  return {
    score: 132,
    scores,
    percentiles,
    flowId: "f0000000-0000-0000-0000-000000000001",
    totalQuestions: answerSpecs.length,
    questions: answerSpecs.map((a, i) => ({
      id: i + 1,
      type: a.category === "self" ? "likert" : "multiple_choice",
      prompt: `Seed question ${i + 1}`,
      category: a.category,
      options: ["Option A", "Option B", "Option C", "Option D"],
      difficulty: 2,
    })),
    answers: answerSpecs.map((a, i) => ({
      questionId: i + 1,
      selectedOption: a.correct ? 0 : 2,
      timeSpent: a.timeMs,
      isCorrect: a.category === "self" ? null : a.correct,
      category: a.category,
      type: a.category === "self" ? "likert" : "multiple_choice",
      isScored: a.category !== "self",
    })),
  };
}

function bhPayload(): Prisma.InputJsonValue {
  const domains = [
    { domain: "cognitive", score: 0.86, status: "Strong" },
    { domain: "vascular", score: 0.81, status: "Strong" },
    { domain: "sleep", score: 0.54, status: "Needs Attention" },
    { domain: "movement", score: 0.78, status: "Stable" },
    { domain: "sensory", score: 0.88, status: "Strong" },
    { domain: "mood", score: 0.72, status: "Stable" },
    { domain: "reserve", score: 0.84, status: "Strong" },
  ];
  const top3 = [...domains].sort((a, b) => a.score - b.score).slice(0, 3);
  const flagged = domains.filter(
    (d) => d.status === "Needs Attention" || d.status === "Priority Area",
  );
  const answers: Record<string, number> = {};
  for (let i = 1; i <= 30; i++) answers[String(i)] = i % 4;
  return {
    questions: Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      prompt: `BH seed question ${i + 1}`,
      domain: domains[i % domains.length]!.domain,
      options: ["Never", "Rarely", "Sometimes", "Often"],
    })),
    totalQuestions: 30,
    answers,
    focus: "top3",
    focus_label: "Deeper sleep",
    top3,
    risk_index: 39,
    flagged_count: flagged.length,
    result: {
      domains,
      top3,
      overallStatus: "Stable",
      riskIndex: 39,
      flaggedCount: flagged.length,
    },
  };
}

function hgPayload(): Prisma.InputJsonValue {
  const traitScores = {
    openness: 88,
    conscientiousness: 41,
    extraversion: 52,
    agreeableness: 58,
    neuroticism: 40,
    structurePreference: 55,
    autonomyNeed: 67,
    riskTolerance: 58,
    peopleOrientation: 47,
    systemsOrientation: 84,
    creativityOrientation: 70,
    detailOrientation: 50,
    leadershipDrive: 44,
    persuasionComfort: 39,
    learningVelocity: 81,
  };
  return {
    totalQuestions: 40,
    responses: Object.keys(traitScores).map((k, i) => ({
      questionId: `seed-q${i + 1}`,
      module: "quiz",
      value: 4,
      trait: k,
    })),
    result: {
      traitScores,
      primary: "pattern-seer",
      secondary: "analytical-architect",
      weakestTrait: "conscientiousness",
      topTraits: [
        "openness",
        "systemsOrientation",
        "learningVelocity",
        "creativityOrientation",
        "autonomyNeed",
        "riskTolerance",
      ],
    },
  };
}

/* --------------------------- Body category --------------------------- */

/** Body IQ — seven positive-weight domains + a 100/15 headline score. */
function bodyPayload(): Prisma.InputJsonValue {
  const subScores = {
    movement: 74,
    recovery: 52,
    energy: 63,
    nutrition: 71,
    resilience: 68,
    load: 58,
    vitals: 80,
  } as const;
  const labels: Record<string, string> = {
    movement: "Movement & strength",
    recovery: "Rest & recovery",
    energy: "Daily energy",
    nutrition: "Food & hydration",
    resilience: "Resilience",
    load: "Stress load",
    vitals: "Your numbers",
  };
  const ordered = Object.entries(subScores)
    .map(([domain, value]) => ({ domain, label: labels[domain]!, value }))
    .sort((a, b) => b.value - a.value);
  const answers: Record<string, number> = {};
  for (let i = 1; i <= 24; i++) answers[String(i)] = (i + 1) % 5;
  return {
    totalQuestions: 24,
    questions: Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      prompt: `Body IQ seed question ${i + 1}`,
      domain: Object.keys(subScores)[i % 7]!,
      options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
    })),
    answers,
    score: 108,
    band: "typical",
    sub_scores: subScores,
    strongest: ordered[0]!.domain,
    weakest: ordered[ordered.length - 1]!.domain,
    result: {
      score: 108,
      band: "typical",
      subScores,
      ordered,
      strongest: ordered[0]!.domain,
      weakest: ordered[ordered.length - 1]!.domain,
    },
  };
}

/** Sleep Health — seven load-weight domains with plain-language statuses. */
function sleepPayload(): Prisma.InputJsonValue {
  const labels: Record<string, string> = {
    duration: "How long you sleep",
    latency: "Falling asleep",
    continuity: "Staying asleep",
    rhythm: "Timing & rhythm",
    environment: "Room & wind-down",
    stimulants: "Caffeine, alcohol & screens",
    daytime: "How your days feel",
  };
  const loads: Record<string, number> = {
    latency: 0.72,
    stimulants: 0.58,
    continuity: 0.47,
    daytime: 0.41,
    rhythm: 0.33,
    duration: 0.24,
    environment: 0.18,
  };
  const status = (load: number) =>
    load < 0.25 ? "solid" : load < 0.45 ? "watch" : load < 0.68 ? "strained" : "urgent";
  const domains = Object.entries(loads)
    .map(([domain, load]) => ({ domain, label: labels[domain]!, load, status: status(load) }))
    .sort((a, b) => b.load - a.load);
  const flags = domains
    .filter((d) => d.status === "strained" || d.status === "urgent")
    .map((d) => d.domain);
  const avg = domains.reduce((s, d) => s + d.load, 0) / domains.length;
  const overall = avg < 0.28 ? "settled" : avg < 0.5 ? "mixed" : "disrupted";
  const answers: Record<string, number> = {};
  for (let i = 1; i <= 26; i++) answers[String(i)] = i % 5;
  answers["11"] = 1;
  return {
    totalQuestions: 26,
    questions: Array.from({ length: 26 }, (_, i) => ({
      id: i + 1,
      prompt: `Sleep Health seed question ${i + 1}`,
      domain: Object.keys(labels)[i % 7]!,
      options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
    })),
    answers,
    overall,
    flags,
    flagged_count: flags.length,
    weakest: domains[0]!.domain,
    strongest: domains[domains.length - 1]!.domain,
    breathing_flag: false,
    result: {
      domains,
      flags,
      weakest: domains[0]!.domain,
      strongest: domains[domains.length - 1]!.domain,
      overall,
      breathingFlag: false,
    },
  };
}

/** Hidden Athlete — three signed axes selecting one of eight archetypes. */
function athletePayload(): Prisma.InputJsonValue {
  const primary = {
    key: "metronome",
    name: "The Metronome",
    tagline: "Long, steady, and repeatable",
    summary:
      "Your body rewards accumulation. You hold a pace others fade from, and you get stronger from turning up rather than from any single hard day. Given a plan and enough weeks, you compound.",
    trainsBestWith: [
      "Steady sessions you could extend by ten minutes",
      "The same week repeated with small increases",
      "One clear number to grow — minutes, distance, or total load",
    ],
    breaksDownWhen: [
      "Everything becomes hard and nothing stays easy",
      "The plan changes before a block finishes",
      "Progress is judged weekly instead of monthly",
    ],
  };
  const secondary = {
    key: "technician",
    name: "The Interval Technician",
    tagline: "Precise work, clean recovery",
    summary:
      "You do your best work in defined pieces with defined rest. Structure is not a constraint for you, it is the thing that lets you go hard safely. You improve fastest when the session has edges.",
    trainsBestWith: [
      "Repeats with fixed work and rest",
      "Sessions that end on time, not on feel",
      "Measured progression week to week",
    ],
    breaksDownWhen: [
      "Sessions blur into unbroken slogs",
      "Rest gets cut to save time",
      "Hard days stack without an easy one between",
    ],
  };
  const normalized = { endurance: 0.62, volume: 0.48, structure: 0.21 };
  const answers: Record<string, number> = {};
  for (let i = 1; i <= 22; i++) answers[String(i)] = i % 4;
  return {
    totalQuestions: 22,
    questions: Array.from({ length: 22 }, (_, i) => ({
      id: i + 1,
      prompt: `Hidden Athlete seed question ${i + 1}`,
      domain: i < 2 ? null : "axis",
      options: ["Option A", "Option B", "Option C", "Option D"],
    })),
    answers,
    archetype: primary.key,
    archetype_name: primary.name,
    secondary: secondary.key,
    axes: normalized,
    result: {
      archetype: primary,
      secondary,
      axes: { endurance: 18, volume: 12, structure: 5 },
      normalized,
    },
  };
}



async function findUsernameByEmail(
  cognito: CognitoIdentityProviderClient,
  poolId: string,
  email: string,
): Promise<string | null> {
  const listed = await cognito.send(
    new ListUsersCommand({
      UserPoolId: poolId,
      Filter: `email = "${email}"`,
      Limit: 1,
    }),
  );
  return listed.Users?.[0]?.Username ?? null;
}

async function ensureCognitoUser(
  cognito: CognitoIdentityProviderClient,
  poolId: string,
  email: string,
  password: string,
): Promise<{ username: string; sub: string; created: boolean }> {
  let username = await findUsernameByEmail(cognito, poolId, email);
  let created = false;

  if (!username) {
    try {
      const createdUser = await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: poolId,
          Username: email,
          MessageAction: "SUPPRESS",
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" },
            { Name: "name", Value: "E2E Complete" },
          ],
        }),
      );
      username = createdUser.User?.Username || email;
      created = true;
    } catch (err) {
      if (err instanceof UsernameExistsException) {
        username = (await findUsernameByEmail(cognito, poolId, email)) || email;
      } else {
        throw err;
      }
    }
  }

  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: poolId,
      Username: username,
      Password: password,
      Permanent: true,
    }),
  );

  const got = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: poolId,
      Username: username,
    }),
  );
  const sub = attr(got.UserAttributes, "sub");
  if (!sub) {
    throw new Error(`Cognito user ${username} has no sub attribute`);
  }

  return { username, sub, created };
}

async function seedDatabase(userId: string, email: string) {
  const prisma = createPrisma();
  const now = new Date();

  try {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: DISPLAY_NAME,
        subscriptionTier: "complete",
        entitledBranch: null,
        hasUsedTrial: true,
        declinedUpsells: [],
        brainScore: 132,
        xp: 500,
        level: 3,
        firstReportSeenIqAt: now,
        firstReportSeenBhAt: now,
        firstReportSeenHgAt: now,
      },
      update: {
        displayName: DISPLAY_NAME,
        subscriptionTier: "complete",
        entitledBranch: null,
        hasUsedTrial: true,
        declinedUpsells: [],
        brainScore: 132,
        firstReportSeenIqAt: now,
        firstReportSeenBhAt: now,
        firstReportSeenHgAt: now,
      },
    });

    // Clear addon purchases unless INCLUDE_ADDONS; upsells depend on INCLUDE_UPSELLS.
    const clearFilters = [
      ...(INCLUDE_UPSELLS
        ? []
        : [{ productKey: { in: [...UPSELL_PRODUCT_KEYS] } }]),
      ...(INCLUDE_ADDONS ? [] : [{ productKey: { startsWith: "addon_" } }]),
    ];
    if (clearFilters.length > 0) {
      await prisma.userPurchase.deleteMany({
        where: { userId, OR: clearFilters },
      });
    }



    async function ensureActivePurchase(productKey: string) {
      const existing = await prisma.userPurchase.findFirst({
        where: { userId, productKey },
        orderBy: { purchasedAt: "desc" },
      });
      if (existing) {
        await prisma.userPurchase.update({
          where: { id: existing.id },
          data: {
            status: "active",
            amountCents: 0,
          },
        });
        await prisma.userPurchase.deleteMany({
          where: {
            userId,
            productKey,
            id: { not: existing.id },
          },
        });
      } else {
        await prisma.userPurchase.create({
          data: {
            userId,
            productKey,
            status: "active",
            amountCents: 0,
            purchasedAt: now,
          },
        });
      }
    }

    await ensureActivePurchase("iq_subscription");

    if (INCLUDE_UPSELLS) {
      for (const key of UPSELL_PRODUCT_KEYS) {
        await ensureActivePurchase(key);
      }
    }

    if (INCLUDE_ADDONS) {
      for (const key of ADDON_PRODUCT_KEYS) {
        await ensureActivePurchase(key);
      }
    }

    const completions: Array<{ branch: string; payload: Prisma.InputJsonValue }> =
      [
        { branch: "iq", payload: iqPayload() },
        { branch: "brain-health", payload: bhPayload() },
        { branch: "hidden-genius", payload: hgPayload() },
        { branch: "body", payload: bodyPayload() },
        { branch: "sleep-health", payload: sleepPayload() },
        { branch: "hidden-athlete", payload: athletePayload() },
      ];

    for (const c of completions) {
      await prisma.testCompletion.upsert({
        where: {
          userId_branch: { userId, branch: c.branch },
        },
        create: {
          userId,
          branch: c.branch,
          completedAt: now,
          payload: c.payload,
        },
        update: {
          completedAt: now,
          payload: c.payload,
        },
      });
    }

    const purchaseCount = await prisma.userPurchase.count({ where: { userId } });
    const completionCount = await prisma.testCompletion.count({
      where: { userId },
    });

    const expectedPurchases =
      1 +
      (INCLUDE_UPSELLS ? UPSELL_PRODUCT_KEYS.length : 0) +
      (INCLUDE_ADDONS ? ADDON_PRODUCT_KEYS.length : 0);
    console.log(`DB seeded for ${email}`);
    console.log(
      `  purchases: ${purchaseCount} (expect ${expectedPurchases}: iq_subscription${INCLUDE_UPSELLS ? " + 3 upsells" : ""}${INCLUDE_ADDONS ? ` + ${ADDON_PRODUCT_KEYS.length} add-ons` : ""})`,
    );
    console.log(
      `  completions: ${completionCount} (expect ${completions.length})`,
    );

  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!POOL_ID) throw new Error("COGNITO_USER_POOL_ID is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

  const cognito = new CognitoIdentityProviderClient({ region: REGION });
  console.log(`Ensuring Cognito user ${EMAIL} in pool ${POOL_ID}…`);
  const { username, sub, created } = await ensureCognitoUser(
    cognito,
    POOL_ID,
    EMAIL,
    PASSWORD,
  );
  console.log(
    created
      ? `Created Cognito user (username=${username})`
      : `Cognito user already existed (username=${username}); password reset`,
  );
  console.log(`  sub: ${sub}`);

  await seedDatabase(sub, EMAIL);

  console.log("\nSign in with:");
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log(`  Cognito sub (profiles.user_id): ${sub}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
