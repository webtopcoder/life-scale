/**
 * Seed catalog content from CSVs extracted from the Supabase backup.
 *
 *   cd api && npm run db:seed
 *
 * Idempotent: upserts by primary key `id`.
 */
import "dotenv/config";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";

const DATA_DIR = path.join(__dirname, "seed", "data");

function createPrisma() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");
  // `pg` does not understand Prisma's `?schema=` query param.
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

/** Minimal RFC4180 CSV reader that preserves multiline quoted fields. */
async function readCsv(fileName: string): Promise<Record<string, string>[]> {
  const filePath = path.join(DATA_DIR, fileName);
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  const rows: Record<string, string>[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let firstChunk = true;

  const flushRow = () => {
    fields.push(field);
    field = "";
    if (!headers) {
      headers = fields;
    } else if (fields.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = fields[i] ?? "";
      });
      rows.push(row);
    } else {
      throw new Error(
        `${fileName}: column count ${fields.length} != ${headers.length}`,
      );
    }
    fields = [];
  };

  for await (const rawLine of rl) {
    const chunk = firstChunk ? rawLine : `\n${rawLine}`;
    firstChunk = false;
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (inQuotes) {
        if (ch === '"') {
          if (chunk[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(field);
        field = "";
      } else if (ch === "\n") {
        flushRow();
      } else if (ch !== "\r") {
        field += ch;
      }
    }
  }
  if (inQuotes) throw new Error(`${fileName}: unterminated quote`);
  if (field.length > 0 || fields.length > 0) flushRow();
  return rows;
}

function emptyToNull(v: string): string | null {
  return v === "" ? null : v;
}

function parseBool(v: string): boolean {
  return v === "t" || v === "true" || v === "1";
}

function parseIntOrNull(v: string): number | null {
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid int: ${v}`);
  return n;
}

function parseJson(v: string, fallback: Prisma.InputJsonValue): Prisma.InputJsonValue {
  if (v === "") return fallback;
  return JSON.parse(v) as Prisma.InputJsonValue;
}

function parseNullableJson(
  v: string,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (v === "") return Prisma.DbNull;
  return JSON.parse(v) as Prisma.InputJsonValue;
}

/** Postgres text-array literal: {a,b} or {"a b"} */
function parsePgTextArray(v: string): string[] {
  if (v === "" || v === "{}") return [];
  const inner = v.slice(1, -1);
  if (!inner) return [];
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inQuotes) {
      if (ch === '"') {
        if (inner[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function main() {
  const prisma = createPrisma();
  try {
    const flows = await readCsv("onboarding_flows.csv");
    console.log(`Seeding onboarding_flows (${flows.length})…`);
    for (const row of flows) {
      await prisma.onboardingFlow.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          isActive: parseBool(row.is_active),
          createdAt: new Date(row.created_at),
        },
        update: {
          name: row.name,
          isActive: parseBool(row.is_active),
        },
      });
    }

    const questions = await readCsv("onboarding_questions.csv");
    console.log(`Seeding onboarding_questions (${questions.length})…`);
    for (const row of questions) {
      await prisma.onboardingQuestion.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          flowId: row.flow_id,
          questionId: Number(row.question_id),
          type: row.type,
          prompt: row.prompt,
          image: emptyToNull(row.image),
          options: parseJson(row.options, []),
          correctAnswer: parseIntOrNull(row.correct_answer),
          category: row.category,
          difficulty: Number(row.difficulty || 1),
          hasReinforcement: parseBool(row.has_reinforcement),
          orderIndex: Number(row.order_index || 0),
          createdAt: new Date(row.created_at),
          subskill: emptyToNull(row.subskill),
          subtitle: emptyToNull(row.subtitle),
          sequence: parseNullableJson(row.sequence),
          displayMs: parseIntOrNull(row.display_ms),
          targetPosition: parseIntOrNull(row.target_position),
          sequenceVariant: emptyToNull(row.sequence_variant),
          targetDelayMs: parseNullableJson(row.target_delay_ms),
          timeLimitMs: parseIntOrNull(row.time_limit_ms),
        },
        update: {
          flowId: row.flow_id,
          questionId: Number(row.question_id),
          type: row.type,
          prompt: row.prompt,
          image: emptyToNull(row.image),
          options: parseJson(row.options, []),
          correctAnswer: parseIntOrNull(row.correct_answer),
          category: row.category,
          difficulty: Number(row.difficulty || 1),
          hasReinforcement: parseBool(row.has_reinforcement),
          orderIndex: Number(row.order_index || 0),
          subskill: emptyToNull(row.subskill),
          subtitle: emptyToNull(row.subtitle),
          sequence: parseNullableJson(row.sequence),
          displayMs: parseIntOrNull(row.display_ms),
          targetPosition: parseIntOrNull(row.target_position),
          sequenceVariant: emptyToNull(row.sequence_variant),
          targetDelayMs: parseNullableJson(row.target_delay_ms),
          timeLimitMs: parseIntOrNull(row.time_limit_ms),
        },
      });
    }

    const achievements = await readCsv("achievements.csv");
    console.log(`Seeding achievements (${achievements.length})…`);
    for (const row of achievements) {
      await prisma.achievement.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          name: row.name,
          description: emptyToNull(row.description),
          icon: row.icon || "trophy",
          xpReward: Number(row.xp_reward || 0),
          conditionJson: parseJson(row.condition_json, {}),
          createdAt: new Date(row.created_at),
          branch: row.branch || "iq",
        },
        update: {
          name: row.name,
          description: emptyToNull(row.description),
          icon: row.icon || "trophy",
          xpReward: Number(row.xp_reward || 0),
          conditionJson: parseJson(row.condition_json, {}),
          branch: row.branch || "iq",
        },
      });
    }

    const teasers = await readCsv("brain_teasers.csv");
    console.log(`Seeding brain_teasers (${teasers.length})…`);
    for (const row of teasers) {
      await prisma.brainTeaser.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title,
          description: emptyToNull(row.description),
          format: row.format as never,
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          contentJson: parseJson(row.content_json, {}),
          solution: emptyToNull(row.solution),
          xpReward: Number(row.xp_reward || 0),
          createdAt: new Date(row.created_at),
          branch: row.branch || "iq",
        },
        update: {
          title: row.title,
          description: emptyToNull(row.description),
          format: row.format as never,
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          contentJson: parseJson(row.content_json, {}),
          solution: emptyToNull(row.solution),
          xpReward: Number(row.xp_reward || 0),
          branch: row.branch || "iq",
        },
      });
    }

    const lessons = await readCsv("lessons.csv");
    console.log(`Seeding lessons (${lessons.length})…`);
    for (const row of lessons) {
      await prisma.lesson.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title,
          description: emptyToNull(row.description),
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          modulesJson: parseJson(row.modules_json, []),
          quizJson: parseJson(row.quiz_json, []),
          xpReward: Number(row.xp_reward || 0),
          orderIndex: Number(row.order_index || 0),
          createdAt: new Date(row.created_at),
          branch: row.branch || "iq",
        },
        update: {
          title: row.title,
          description: emptyToNull(row.description),
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          modulesJson: parseJson(row.modules_json, []),
          quizJson: parseJson(row.quiz_json, []),
          xpReward: Number(row.xp_reward || 0),
          orderIndex: Number(row.order_index || 0),
          branch: row.branch || "iq",
        },
      });
    }

    const puzzles = await readCsv("puzzles.csv");
    console.log(`Seeding puzzles (${puzzles.length})…`);
    for (const row of puzzles) {
      await prisma.puzzle.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          title: row.title,
          format: row.format as never,
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          contentJson: parseJson(row.content_json, {}),
          xpReward: Number(row.xp_reward || 0),
          timeLimitSeconds: parseIntOrNull(row.time_limit_seconds),
          createdAt: new Date(row.created_at),
          branches: parsePgTextArray(row.branches),
        },
        update: {
          title: row.title,
          format: row.format as never,
          category: row.category as never,
          difficulty: Number(row.difficulty || 1),
          contentJson: parseJson(row.content_json, {}),
          xpReward: Number(row.xp_reward || 0),
          timeLimitSeconds: parseIntOrNull(row.time_limit_seconds),
          branches: parsePgTextArray(row.branches),
        },
      });
    }

    console.log("Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
