import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// --- Types (mirroring your existing definitions) ---

type FunnelStep = {
  event: string;
  kind: 'EventsNode';
  name: string;
  custom_name?: string;
  properties?: Array<{
    key: string;
    operator: string;
    type: string;
    value: string[];
  }>;
};

type FunnelInsightPayload = {
  name: string;
  query: {
    kind: 'FunnelsQuery';
    funnelsFilter: {
      funnelVizType: string;
    };
    series: FunnelStep[];
  };
};

type Question = {
  id: number;
  hasReinforcement?: boolean;
};

// --- Helpers copied from your example ---

function assessmentStep(questionNumber: number): FunnelStep {
  return {
    event: 'assessment_question_answered',
    kind: 'EventsNode',
    name: 'assessment_question_answered',
    properties: [
      {
        key: 'question_number',
        operator: 'exact',
        type: 'event',
        value: [String(questionNumber)],
      },
    ],
  };
}

function reinforcementStep(count: number): FunnelStep {
  return {
    event: 'funnel_step_completed',
    kind: 'EventsNode',
    name: 'funnel_step_completed',
    custom_name: `Reinforcement ${count}`,
    properties: [
      { key: 'step', operator: 'exact', type: 'event', value: ['reinforcement'] },
      {
        key: 'reinforcement_count',
        operator: 'exact',
        type: 'event',
        value: [String(count), `${count}.0`],
      },
    ],
  };
}

function buildSeriesFromQuestions(questions: Question[]): FunnelStep[] {
  const series: FunnelStep[] = [];

  // Fixed pre-question steps
  series.push(
    // Step 1: Start
    { event: 'onboarding_started', kind: 'EventsNode', name: 'onboarding_started' },

    // Step 2: Gender selection
    {
      event: 'funnel_step_completed',
      kind: 'EventsNode',
      name: 'funnel_step_completed',
      custom_name: 'Gender Selected',
      properties: [
        { key: 'action', operator: 'exact', type: 'event', value: ['gender_selected'] },
      ],
    },
  );

  let questionNumber = 1;
  let reinforcementCount = 1;

  for (const q of questions) {
    series.push(assessmentStep(questionNumber));

    if (q.hasReinforcement) {
      series.push(reinforcementStep(reinforcementCount));
      reinforcementCount += 1;
    }

    questionNumber += 1;
  }

  // Fixed tail steps
  series.push(
    // Social Proof
    {
      event: 'funnel_step_completed',
      kind: 'EventsNode',
      name: 'funnel_step_completed',
      custom_name: 'Social Proof',
      properties: [
        { key: 'step', operator: 'exact', type: 'event', value: ['social_proof'] },
      ],
    },
    // Calculating
    {
      event: 'funnel_step_completed',
      kind: 'EventsNode',
      name: 'funnel_step_completed',
      custom_name: 'Calculating',
      properties: [
        { key: 'step', operator: 'exact', type: 'event', value: ['calculating'] },
      ],
    },
    // Email Captured
    {
      event: 'funnel_step_completed',
      kind: 'EventsNode',
      name: 'funnel_step_completed',
      custom_name: 'Email Captured',
      properties: [
        { key: 'step', operator: 'exact', type: 'event', value: ['email_capture'] },
      ],
    },
    // Final conversion
    { event: 'checkout_completed', kind: 'EventsNode', name: 'checkout_completed' },
  );

  return series;
}

function buildFunnelPayload(name: string, series: FunnelStep[]): FunnelInsightPayload {
  return {
    name,
    query: {
      kind: 'FunnelsQuery',
      funnelsFilter: {
        funnelVizType: 'steps',
      },
      series,
    },
  };
}

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function createFunnelFromFile(jsonPath: string, funnelName?: string): Promise<void> {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const questions = JSON.parse(raw) as Question[];

  const series = buildSeriesFromQuestions(questions);

  const name =
    funnelName ??
    `Onboarding Conversion Rate – ${path.basename(jsonPath, path.extname(jsonPath))}`;

  const payload = buildFunnelPayload(name, series);

  fs.writeFileSync('scripts/questions/payload.json', JSON.stringify(payload, null, 2));

  const POSTHOG_API_KEY = getEnvOrThrow('POSTHOG_API_KEY');
  const POSTHOG_PROJECT_ID = getEnvOrThrow('POSTHOG_PROJECT_ID');
  const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';

  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create insight: ${response.status} – ${errorText}`);
  }

  const result = (await response.json()) as { id: number | string; short_id?: string };
  console.log(result);
  // eslint-disable-next-line no-console
  console.log('Insight created:', result.id, result.short_id);
}

async function main() {
  const [, , jsonArg, nameArg] = process.argv;
  if (!jsonArg) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: npm run create:funnel -- scripts/questions/questions-<flowId>.json [Funnel Name]',
    );
    process.exit(1);
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const jsonPath = path.isAbsolute(jsonArg)
    ? jsonArg
    : path.resolve(__dirname, jsonArg);

  await createFunnelFromFile(jsonPath, nameArg);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

