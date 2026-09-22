import { Body, Controller, Post, Res, ForbiddenException } from "@nestjs/common";
import type { Response } from "express";
import { IsArray, IsObject, IsOptional, IsString } from "class-validator";
import { CurrentUser, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import {
  API_SCALES,
  categoryOfScale,
  scalesInCategory,
  summarizeCompletion,
} from "./scales";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 2000;

class ChatDto {
  @IsArray()
  messages!: Array<{ role: string; content: string }>;
}

class GenerateDto {
  @IsOptional() @IsObject() scores?: object;
  @IsOptional() @IsString() strongestCategory?: string;
  @IsOptional() @IsString() weakestCategory?: string;
  @IsOptional() @IsString() sessionId?: string;
  @IsOptional() finalScore?: number;
}

@Controller("ai")
export class AiController {
  constructor(private prisma: PrismaService) {}

  private openRouterKey() {
    const k = process.env.OPENROUTER_API_KEY;
    if (!k) throw new Error("OPENROUTER_API_KEY not configured");
    return k;
  }

  private sanitizeMessages(
    raw: Array<{ role: string; content: string }> | undefined,
  ): Array<{ role: string; content: string }> {
    if (!Array.isArray(raw)) return [];
    const cleaned: Array<{ role: string; content: string }> = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      if (item.role !== "user" && item.role !== "assistant") continue;
      if (typeof item.content !== "string") continue;
      const trimmed = item.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) continue;
      cleaned.push({ role: item.role, content: trimmed });
    }
    return cleaned.slice(-MAX_MESSAGES);
  }

  @Post("coach/chat")
  async coachChat(
    @CurrentUser() user: AuthUser,
    @Body() body: ChatDto,
    @Res() res: Response,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.sub },
    });
    const coachTier = profile?.subscriptionTier;
    if (coachTier !== "complete" && coachTier !== "focus") {
      throw new ForbiddenException(
        "AI Coach is only available on the Focus and Complete plans.",
      );
    }

    const messages = this.sanitizeMessages(body.messages);

    // Complete = every scale in every category. Focus = every scale in the one
    // category its entitled scale belongs to.
    const focusCategory =
      coachTier === "focus" ? categoryOfScale(profile?.entitledBranch) : null;
    const entitledScales =
      coachTier === "complete"
        ? API_SCALES
        : focusCategory
          ? scalesInCategory(focusCategory)
          : [];
    const entitledKeys = entitledScales.map((s) => s.key);

    const completions = await this.prisma.testCompletion.findMany({
      where: {
        userId: user.sub,
        ...(coachTier === "complete" ? {} : { branch: { in: entitledKeys } }),
      },
      orderBy: { completedAt: "desc" },
    });

    const summaries = completions
      .map((c) =>
        summarizeCompletion(
          c.branch,
          c.payload as Record<string, unknown> | null,
          c.completedAt,
        ),
      )
      .filter((s): s is NonNullable<typeof s> => !!s);

    const byCategory: Record<string, typeof summaries> = {};
    for (const s of summaries) {
      (byCategory[s.categoryName] ??= []).push(s);
    }

    const completedKeys = new Set(summaries.map((s) => s.scale));
    const notYetTaken = entitledScales
      .filter((s) => !completedKeys.has(s.key))
      .map((s) => `${s.name} (${s.categoryName})`);

    const planLine =
      coachTier === "complete"
        ? "Complete — every scale in every category is unlocked."
        : `Focus — the ${entitledScales[0]?.categoryName ?? "selected"} category is unlocked (${entitledScales.map((s) => s.name).join(", ")}).`;

    const systemPrompt = [
      "You are a friendly, practical AI Coach for Life Scale.",
      "Keep responses short (2-4 paragraphs), plain language, no jargon.",
      `User: ${profile?.displayName || "there"} — streak ${profile?.currentStreak || 0}, level ${profile?.level || 1}.`,
      `Plan: ${planLine}`,
      "",
      "RESULTS (grouped by category):",
      Object.keys(byCategory).length
        ? Object.entries(byCategory)
            .map(
              ([cat, items]) =>
                `${cat}:\n${items
                  .map(
                    (s) =>
                      `  - ${s.name} (${s.role}, ${s.completedAt}): ${s.headline}` +
                      (s.strongest ? ` | strongest: ${s.strongest}` : "") +
                      (s.weakest ? ` | weakest: ${s.weakest}` : "") +
                      (s.flags?.length ? ` | flags: ${s.flags.join(", ")}` : "") +
                      (s.subScores
                        ? ` | sub-scores: ${Object.entries(s.subScores)
                            .map(([k, v]) => `${k} ${v}`)
                            .join(", ")}`
                        : ""),
                  )
                  .join("\n")}`,
            )
            .join("\n")
        : "  (no scales completed yet)",
      "",
      notYetTaken.length
        ? `UNLOCKED BUT NOT YET TAKEN: ${notYetTaken.join(", ")} — you may encourage these.`
        : "The user has completed every scale their plan unlocks.",
      "",
      "RULES: Only reference scales listed under RESULTS; never invent or guess a result for a scale that is not there.",
      coachTier === "complete"
        ? "You may connect and compare findings across categories (for example sleep quality against cognitive results) when it helps the user act."
        : "Stay within the unlocked category; if the user asks about another category, say it is available on the Complete plan.",
      "You cannot access billing, refunds, cancellations, or account ownership verification. Direct those requests to the Help Center.",
    ].join("\n");


    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.openRouterKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      },
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (!aiResponse.ok || !aiResponse.body) {
      res.status(502).json({ error: "AI upstream failed" });
      return;
    }

    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  }

  @Post("generate-learning-path")
  async learningPath(@CurrentUser() user: AuthUser, @Body() body: GenerateDto) {
    const completion = await this.callOpenRouter(
      `Create a concise learning path JSON for cognitive training. Strongest: ${body.strongestCategory}. Weakest: ${body.weakestCategory}. Scores: ${JSON.stringify(body.scores)}. Return JSON only with keys: weeks (array of {title, focus, tasks}).`,
    );
    let planJson: object = { raw: completion };
    try {
      planJson = JSON.parse(completion);
    } catch {
      /* keep raw */
    }
    const saved = await this.prisma.learningPath.create({
      data: {
        userId: user.sub,
        planJson,
        scoresSnapshot: body.scores ?? {},
        strongestCategory: body.strongestCategory,
        weakestCategory: body.weakestCategory,
        finalScore: body.finalScore ?? null,
      },
    });
    return saved;
  }

  @Post("generate-weakness-report")
  async weaknessReport(
    @CurrentUser() user: AuthUser,
    @Body() body: GenerateDto,
  ) {
    const text = await this.callOpenRouter(
      `Write a weakness report as JSON with keys summary, areas[{name,insight,drills}]. Scores: ${JSON.stringify(body.scores)}.`,
    );
    let reportJson: object = { raw: text };
    try {
      reportJson = JSON.parse(text);
    } catch {
      /* keep */
    }
    return this.prisma.generatedReport.create({
      data: {
        userId: user.sub,
        reportType: "weakness",
        reportJson,
        sessionId: body.sessionId,
      },
    });
  }

  @Post("generate-genius-blueprint")
  async geniusBlueprint(
    @CurrentUser() user: AuthUser,
    @Body() body: GenerateDto,
  ) {
    const text = await this.callOpenRouter(
      `Write a genius blueprint as JSON with keys archetype, strengths, roadmap. Scores: ${JSON.stringify(body.scores)}.`,
    );
    let reportJson: object = { raw: text };
    try {
      reportJson = JSON.parse(text);
    } catch {
      /* keep */
    }
    return this.prisma.generatedReport.create({
      data: {
        userId: user.sub,
        reportType: "genius_blueprint",
        reportJson,
        sessionId: body.sessionId,
      },
    });
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.openRouterKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const json = (await r.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content ?? "";
  }
}
