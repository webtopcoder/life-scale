import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchQuestions, FLOW_IDS } from '../src/engine/datasetLoader';

function parseFlowId(argv: string[]): string | undefined {
  const [, , flowId] = argv;
  if (!flowId) return undefined;

  // Allow symbolic flow names like FIXED_V1 / ADAPTIVE_V2
  if (flowId in FLOW_IDS) {
    return FLOW_IDS[flowId as keyof typeof FLOW_IDS];
  }

  return flowId;
}

async function main() {
  const flowId = FLOW_IDS.FIXED_V1;

  const questions = await fetchQuestions(flowId);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const safeFlowId =
    flowId?.replace(/[^a-zA-Z0-9_-]+/g, '_') ?? 'default';

  const outDir = path.join(__dirname, 'questions');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targetPath = path.join(outDir, `questions-${safeFlowId}.json`);

  fs.writeFileSync(targetPath, JSON.stringify(questions, null, 2), 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Saved ${questions.length} questions to ${targetPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to export questions:', err);
  process.exit(1);
});

