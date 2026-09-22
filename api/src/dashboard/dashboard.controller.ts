import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from "class-validator";
import { ContentType, ProgressStatus } from "../generated/prisma/client";
import { CurrentUser, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { upsertProfile } from "../prisma/upsert-profile";
import { levelFromXp } from "./level";


class UpdateProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() subscriptionTier?: string;
  /** null clears single-branch entitlement (complete tier). */
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  entitledBranch?: string | null;
  @IsOptional() @IsBoolean() hasUsedTrial?: boolean;
  @IsOptional() @IsObject() declinedUpsells?: object;
  @IsOptional() @IsString() firstReportSeenIqAt?: string;
  @IsOptional() @IsString() firstReportSeenBhAt?: string;
  @IsOptional() @IsString() firstReportSeenHgAt?: string;
}

class ProgressDto {
  @IsUUID() contentId!: string;
  @IsEnum(ContentType) contentType!: ContentType;
  @IsEnum(ProgressStatus) status!: ProgressStatus;
  @IsOptional() @IsInt() score?: number;
  @IsOptional() @IsInt() timeSpentMs?: number;
  @IsOptional() @IsString() mode?: string;
  @IsOptional() @IsBoolean() completed?: boolean;
}

class BhLogDto {
  @IsString() logDate!: string;
  @IsOptional() @IsInt() focus?: number;
  @IsOptional() @IsInt() mood?: number;
  @IsOptional() @IsBoolean() hydration?: boolean;
  @IsOptional() @IsInt() movementMinutes?: number;
  @IsOptional() @IsNumber() sleepHours?: number;
}

class TestCompletionDto {
  @IsString() branch!: string;
  @IsOptional() @IsObject() payload?: object;
}

class CreatePurchaseDto {
  @IsString() productKey!: string;
  @IsOptional() @IsInt() amountCents?: number;
}

class LikertDto {
  @IsString() testId!: string;
  @IsObject() answersJson!: object;
  @IsInt() maxScore!: number;
  @IsNumber() percentage!: number;
  @IsString() resultLabel!: string;
  @IsInt() totalScore!: number;
}

class AddXpDto {
  /** Server-side guard: points must be a sane, positive integer. */
  @IsInt() @Min(1) @Max(500) amount!: number;
}


@Controller("dashboard")
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  @Get("profile")
  async getProfile(@CurrentUser() user: AuthUser) {
    return upsertProfile(this.prisma, user.sub);
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateProfileDto,
  ) {
    const data: Record<string, unknown> = { ...body };
    for (const key of [
      "firstReportSeenIqAt",
      "firstReportSeenBhAt",
      "firstReportSeenHgAt",
    ] as const) {
      if (body[key]) data[key] = new Date(body[key]!);
    }
    return this.prisma.profile.update({
      where: { userId: user.sub },
      data,
    });
  }

  @Get("brain-teasers")
  async brainTeasers(@Query("branch") branch?: string) {
    return this.prisma.brainTeaser.findMany({
      where: branch ? { branch } : undefined,
      orderBy: { difficulty: "asc" },
    });
  }

  @Get("puzzles")
  async puzzles() {
    return this.prisma.puzzle.findMany({ orderBy: { difficulty: "asc" } });
  }

  @Get("lessons")
  async lessons(@Query("branch") branch?: string) {
    return this.prisma.lesson.findMany({
      where: branch ? { branch } : undefined,
      orderBy: { orderIndex: "asc" },
    });
  }

  @Get("progress")
  async progress(@CurrentUser() user: AuthUser) {
    return this.prisma.userContentProgress.findMany({
      where: { userId: user.sub },
    });
  }

  @Put("progress")
  async upsertProgress(
    @CurrentUser() user: AuthUser,
    @Body() body: ProgressDto,
  ) {
    const key = {
      userId: user.sub,
      contentType: body.contentType,
      contentId: body.contentId,
    };
    const existing = await this.prisma.userContentProgress.findUnique({
      where: { userId_contentType_contentId: key },
    });
    // Points are only earned the first time a piece of content is completed.
    const firstCompletion = !!body.completed && !existing?.completedAt;
    const row = await this.prisma.userContentProgress.upsert({
      where: { userId_contentType_contentId: key },
      create: {
        userId: user.sub,
        contentId: body.contentId,
        contentType: body.contentType,
        status: body.status,
        score: body.score,
        timeSpentMs: body.timeSpentMs,
        mode: body.mode,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        status: body.status,
        score: body.score,
        timeSpentMs: body.timeSpentMs,
        mode: body.mode,
        completedAt: body.completed ? (existing?.completedAt ?? new Date()) : undefined,
      },
    });
    return { ...row, firstCompletion };
  }

  @Get("achievements")
  async achievements(@Query("branch") branch?: string) {
    return this.prisma.achievement.findMany({
      where: branch ? { branch } : undefined,
    });
  }

  @Get("user-achievements")
  async userAchievements(@CurrentUser() user: AuthUser) {
    return this.prisma.userAchievement.findMany({
      where: { userId: user.sub },
    });
  }

  @Post("user-achievements")
  async earnAchievement(
    @CurrentUser() user: AuthUser,
    @Body() body: { achievementId: string },
  ) {
    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId: user.sub, achievementId: body.achievementId },
    });
    if (existing) return { ...existing, granted: false, xpAwarded: 0 };

    let created;
    try {
      created = await this.prisma.userAchievement.create({
        data: { userId: user.sub, achievementId: body.achievementId },
      });
    } catch {
      // Concurrent grant of the same achievement: treat as already earned.
      const row = await this.prisma.userAchievement.findFirst({
        where: { userId: user.sub, achievementId: body.achievementId },
      });
      return { ...row, granted: false, xpAwarded: 0 };
    }

    // Award the achievement points server-side so they can never double-fire.
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: body.achievementId },
    });
    const xpAwarded = Math.max(0, achievement?.xpReward ?? 0);
    if (xpAwarded > 0) {
      const profile = await upsertProfile(this.prisma, user.sub, {
        create: { xp: xpAwarded },
        update: { xp: { increment: xpAwarded } },
      });
      const level = levelFromXp(profile.xp);
      if (level !== profile.level) {
        await this.prisma.profile.update({
          where: { userId: user.sub },
          data: { level },
        });
      }
    }
    return { ...created, granted: true, xpAwarded };
  }


  @Post("check-in")
  async checkIn(@CurrentUser() user: AuthUser) {
    const profile = await upsertProfile(this.prisma, user.sub);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const last = profile.lastLoginDate ? new Date(profile.lastLoginDate) : null;
    if (last) last.setUTCHours(0, 0, 0, 0);

    // Already checked in today: no points, no writes.
    if (last && last.getTime() === today.getTime()) {
      return {
        profile,
        alreadyCheckedIn: true,
        xpGain: 0,
        streak: profile.currentStreak,
        milestone: null as string | null,
      };
    }

    let streak = 1;
    if (last) {
      const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
      streak = diffDays === 1 ? profile.currentStreak + 1 : 1;
    }

    let xpGain = 10;
    let milestone: string | null = null;
    if (streak > 0 && streak % 30 === 0) {
      xpGain += 25;
      milestone = `${streak}-day streak`;
    } else if (streak > 0 && streak % 7 === 0) {
      xpGain += 10;
      milestone = `${streak}-day streak`;
    } else if (streak === 3) {
      xpGain += 5;
      milestone = "3-day streak";
    }

    const xp = profile.xp + xpGain;
    const longest = Math.max(profile.longestStreak, streak);
    const updated = await this.prisma.profile.update({
      where: { userId: user.sub },
      data: {
        currentStreak: streak,
        longestStreak: longest,
        lastLoginDate: today,
        xp,
        level: levelFromXp(xp),
      },
    });
    return { profile: updated, alreadyCheckedIn: false, xpGain, streak, milestone };
  }

  @Post("add-xp")
  async addXp(@CurrentUser() user: AuthUser, @Body() body: AddXpDto) {
    const profile = await upsertProfile(this.prisma, user.sub, {
      create: { xp: body.amount },
      update: { xp: { increment: body.amount } },
    });
    const level = levelFromXp(profile.xp);
    if (level !== profile.level) {
      return this.prisma.profile.update({
        where: { userId: user.sub },
        data: { level },
      });
    }
    return profile;
  }


  @Get("bh-logs")
  async bhLogs(@CurrentUser() user: AuthUser) {
    return this.prisma.bhDailyLog.findMany({
      where: { userId: user.sub },
      orderBy: { logDate: "desc" },
    });
  }

  @Put("bh-logs")
  async upsertBhLog(@CurrentUser() user: AuthUser, @Body() body: BhLogDto) {
    const logDate = new Date(body.logDate);
    return this.prisma.bhDailyLog.upsert({
      where: {
        userId_logDate: { userId: user.sub, logDate },
      },
      create: {
        userId: user.sub,
        logDate,
        focus: body.focus,
        mood: body.mood,
        hydration: body.hydration,
        movementMinutes: body.movementMinutes,
        sleepHours: body.sleepHours,
      },
      update: {
        focus: body.focus,
        mood: body.mood,
        hydration: body.hydration,
        movementMinutes: body.movementMinutes,
        sleepHours: body.sleepHours,
      },
    });
  }

  @Get("test-completions")
  async testCompletions(
    @CurrentUser() user: AuthUser,
    @Query("branch") branch?: string,
  ) {
    return this.prisma.testCompletion.findMany({
      where: {
        userId: user.sub,
        ...(branch ? { branch } : {}),
      },
    });
  }

  @Put("test-completions")
  async upsertTestCompletion(
    @CurrentUser() user: AuthUser,
    @Body() body: TestCompletionDto,
  ) {
    return this.prisma.testCompletion.upsert({
      where: {
        userId_branch: { userId: user.sub, branch: body.branch },
      },
      create: {
        userId: user.sub,
        branch: body.branch,
        payload: body.payload ?? undefined,
      },
      update: {
        payload: body.payload ?? undefined,
        completedAt: new Date(),
      },
    });
  }

  @Get("purchases")
  async purchases(@CurrentUser() user: AuthUser) {
    return this.prisma.userPurchase.findMany({
      where: { userId: user.sub },
      orderBy: { purchasedAt: "desc" },
    });
  }

  /**
   * Creates a purchase row. Client-side grants for `addon_*` are blocked —
   * add-ons must go through Life-Scale (`POST /billing/addon-upsell`).
   */
  @Post("purchases")
  async createPurchase(
    @CurrentUser() user: AuthUser,
    @Body() body: CreatePurchaseDto,
  ) {
    const productKey = body.productKey || "iq_subscription";
    if (productKey.startsWith("addon_")) {
      throw new BadRequestException(
        "Add-on purchases must use /billing/addon-upsell",
      );
    }
    const amountCents = body.amountCents ?? 0;
    const existing = await this.prisma.userPurchase.findFirst({
      where: { userId: user.sub, productKey },
      orderBy: { purchasedAt: "desc" },
    });
    if (existing) {
      return this.prisma.userPurchase.update({
        where: { id: existing.id },
        data: { status: "active", amountCents },
      });
    }
    return this.prisma.userPurchase.create({
      data: {
        userId: user.sub,
        productKey,
        status: "active",
        amountCents,
      },
    });
  }

  @Get("reports")
  async reports(@CurrentUser() user: AuthUser) {
    return this.prisma.userReport.findMany({
      where: { userId: user.sub },
      orderBy: { purchasedAt: "desc" },
    });
  }

  @Get("reports/:id")
  async report(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prisma.userReport.findFirst({
      where: { id, userId: user.sub },
    });
  }

  @Get("generated-reports")
  async generatedReports(
    @CurrentUser() user: AuthUser,
    @Query("type") type?: string,
  ) {
    return this.prisma.generatedReport.findMany({
      where: {
        userId: user.sub,
        ...(type ? { reportType: type } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("learning-paths")
  async learningPaths(@CurrentUser() user: AuthUser) {
    return this.prisma.learningPath.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get("coach/conversations")
  async conversations(@CurrentUser() user: AuthUser) {
    return this.prisma.coachConversation.findMany({
      where: { userId: user.sub },
      orderBy: { updatedAt: "desc" },
    });
  }

  @Post("coach/conversations")
  async createConversation(
    @CurrentUser() user: AuthUser,
    @Body() body: { title?: string; messagesJson?: object },
  ) {
    return this.prisma.coachConversation.create({
      data: {
        userId: user.sub,
        title: body.title,
        messagesJson: body.messagesJson ?? [],
      },
    });
  }

  @Patch("coach/conversations/:id")
  async updateConversation(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { title?: string; messagesJson?: object },
  ) {
    const existing = await this.prisma.coachConversation.findFirst({
      where: { id, userId: user.sub },
    });
    if (!existing) return null;
    return this.prisma.coachConversation.update({
      where: { id },
      data: body,
    });
  }

  @Delete("coach/conversations/:id")
  async deleteConversation(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    await this.prisma.coachConversation.deleteMany({
      where: { id, userId: user.sub },
    });
    return { ok: true };
  }

  @Get("likert-results")
  async likertResults(@CurrentUser() user: AuthUser) {
    return this.prisma.likertTestResult.findMany({
      where: { userId: user.sub },
    });
  }

  @Post("likert-results")
  async insertLikert(@CurrentUser() user: AuthUser, @Body() body: LikertDto) {
    const prior = await this.prisma.likertTestResult.findFirst({
      where: { userId: user.sub, testId: body.testId },
    });
    const row = await this.prisma.likertTestResult.create({
      data: {
        userId: user.sub,
        testId: body.testId,
        answersJson: body.answersJson,
        maxScore: body.maxScore,
        percentage: body.percentage,
        resultLabel: body.resultLabel,
        totalScore: body.totalScore,
      },
    });
    return { ...row, firstCompletion: !prior };
  }

}
