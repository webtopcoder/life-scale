import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { Public } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";

class UpsertSessionDto {
  @IsString() sessionId!: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsBoolean() isV2?: boolean;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsInt() finalScore?: number;
  @IsOptional() @IsNumber() adaptiveAbility?: number;
  @IsOptional() @IsString() strongestCategory?: string;
  @IsOptional() @IsString() secondaryCategory?: string;
  @IsOptional() @IsString() trajectory?: string;
  @IsOptional() @IsInt() completionTimeMs?: number;
  @IsOptional() @IsObject() scores?: object;
  @IsOptional() @IsObject() percentiles?: object;
  @IsOptional() @IsBoolean() completed?: boolean;
}

class UpdateSessionResultsDto {
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  finalScore?: number | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  completionTimeMs?: number | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsNumber()
  adaptiveAbility?: number | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  strongestCategory?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  secondaryCategory?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  trajectory?: string | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsObject()
  scores?: object | null;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsObject()
  percentiles?: object | null;
}

class InsertAnswerDto {
  @IsString() sessionId!: string;
  @IsInt() questionId!: number;
  @IsInt() selectedOption!: number;
  @IsInt() timeSpentMs!: number;
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsBoolean()
  isCorrect?: boolean | null;
}

class UpsertUserProfileDto {
  @IsString() sessionId!: string;
  @IsString() email!: string;
  @IsOptional() @IsInt() finalScore?: number;
  @IsOptional() @IsString() strongestCategory?: string;
  @IsOptional() @IsNumber() adaptiveAbility?: number;
  @IsOptional() @IsInt() percentile?: number;
  @IsOptional() @IsString() externalId?: string;
}

@Controller("funnel")
export class FunnelController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post("sessions")
  async upsertSession(@Body() body: UpsertSessionDto) {
    const data = {
      gender: body.gender,
      isV2: body.isV2 ?? false,
      email: body.email,
      finalScore: body.finalScore,
      adaptiveAbility: body.adaptiveAbility,
      strongestCategory: body.strongestCategory,
      secondaryCategory: body.secondaryCategory,
      trajectory: body.trajectory,
      completionTimeMs: body.completionTimeMs,
      scores: body.scores,
      percentiles: body.percentiles,
      ...(body.completed ? { completedAt: new Date() } : {}),
    };
    return this.prisma.assessmentSession.upsert({
      where: { sessionId: body.sessionId },
      create: { sessionId: body.sessionId, ...data },
      update: data,
    });
  }

  @Public()
  @Patch("sessions/:sessionId")
  async updateSessionResults(
    @Param("sessionId") sessionId: string,
    @Body() body: UpdateSessionResultsDto,
  ) {
    const existing = await this.prisma.assessmentSession.findUnique({
      where: { sessionId },
    });
    if (!existing) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return this.prisma.assessmentSession.update({
      where: { sessionId },
      data: {
        finalScore: body.finalScore ?? undefined,
        completionTimeMs: body.completionTimeMs ?? undefined,
        adaptiveAbility: body.adaptiveAbility,
        strongestCategory: body.strongestCategory,
        secondaryCategory: body.secondaryCategory,
        trajectory: body.trajectory,
        scores: body.scores ?? undefined,
        percentiles: body.percentiles ?? undefined,
        completedAt: existing.completedAt ?? new Date(),
      },
    });
  }

  @Public()
  @Get("sessions/:sessionId")
  async getSession(@Param("sessionId") sessionId: string) {
    return this.prisma.assessmentSession.findUnique({ where: { sessionId } });
  }

  @Public()
  @Post("answers")
  async insertAnswer(@Body() body: InsertAnswerDto) {
    return this.prisma.assessmentAnswer.create({
      data: {
        sessionId: body.sessionId,
        questionId: body.questionId,
        selectedOption: body.selectedOption,
        timeSpentMs: body.timeSpentMs,
        isCorrect: body.isCorrect ?? null,
      },
    });
  }

  @Public()
  @Get("answers")
  async listAnswers(@Query("sessionId") sessionId: string) {
    return this.prisma.assessmentAnswer.findMany({ where: { sessionId } });
  }

  @Public()
  @Post("user-profiles")
  async upsertUserProfile(@Body() body: UpsertUserProfileDto) {
    const existing = await this.prisma.userProfile.findFirst({
      where: { sessionId: body.sessionId, email: body.email },
    });
    if (existing) {
      return this.prisma.userProfile.update({
        where: { id: existing.id },
        data: {
          finalScore: body.finalScore,
          strongestCategory: body.strongestCategory,
          adaptiveAbility: body.adaptiveAbility,
          percentile: body.percentile,
          externalId: body.externalId,
        },
      });
    }
    return this.prisma.userProfile.create({
      data: {
        sessionId: body.sessionId,
        email: body.email,
        finalScore: body.finalScore,
        strongestCategory: body.strongestCategory,
        adaptiveAbility: body.adaptiveAbility,
        percentile: body.percentile,
        externalId: body.externalId,
      },
    });
  }

  @Public()
  @Get("user-profiles")
  async getUserProfiles(
    @Query("email") email?: string,
    @Query("sessionId") sessionId?: string,
  ) {
    return this.prisma.userProfile.findMany({
      where: {
        ...(email ? { email } : {}),
        ...(sessionId ? { sessionId } : {}),
      },
    });
  }
}
