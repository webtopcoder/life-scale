import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller("onboarding")
export class OnboardingController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get("questions")
  async getQuestions(@Query("flow") flow?: string) {
    // Clients send FLOW_IDS UUIDs; name remains supported for manual/debug calls.
    // Query by id OR name separately — mixing both in one OR makes Postgres
    // compare text = uuid and return no rows / error.
    const flowRow = await this.prisma.onboardingFlow.findFirst({
      where: flow
        ? UUID_RE.test(flow)
          ? { id: flow, isActive: true }
          : { name: flow, isActive: true }
        : { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!flowRow) return { flow: null, questions: [] };
    const questions = await this.prisma.onboardingQuestion.findMany({
      where: { flowId: flowRow.id },
      orderBy: { orderIndex: "asc" },
    });
    // Client Answer.questionId / assessment_answers.question_id use the
    // integer catalog id, not the row UUID.
    const safe = questions.map(
      ({ correctAnswer: _c, id: _rowId, ...q }) => ({
        ...q,
        id: q.questionId,
      }),
    );
    return { flow: flowRow, questions: safe };
  }
}
