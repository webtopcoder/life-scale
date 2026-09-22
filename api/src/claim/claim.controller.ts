import { Body, Controller, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { CurrentUser, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { upsertProfile } from "../prisma/upsert-profile";

class ClaimDto {
  @IsOptional()
  @IsString()
  funnelSessionId?: string;
}

@Controller("claim")
export class ClaimController {
  constructor(private prisma: PrismaService) {}

  @Post("funnel-assets")
  async claim(@CurrentUser() user: AuthUser, @Body() body: ClaimDto) {
    const email = user.email;
    if (email) {
      await this.prisma.userReport.updateMany({
        where: { email, userId: null },
        data: { userId: user.sub },
      });
    }

    if (body.funnelSessionId) {
      await this.prisma.userPurchase.updateMany({
        where: { funnelSessionId: body.funnelSessionId, userId: null },
        data: { userId: user.sub, funnelSessionId: null },
      });
    }

    const sessionIds = new Set<string>();
    if (body.funnelSessionId) sessionIds.add(body.funnelSessionId);
    if (email) {
      const profiles = await this.prisma.userProfile.findMany({
        where: { email },
        select: { sessionId: true },
      });
      for (const p of profiles) sessionIds.add(p.sessionId);
    }

    for (const sid of sessionIds) {
      if (sid === body.funnelSessionId) continue;
      await this.prisma.userPurchase.updateMany({
        where: { funnelSessionId: sid, userId: null },
        data: { userId: user.sub, funnelSessionId: null },
      });
    }

    await upsertProfile(this.prisma, user.sub, {
      create: { displayName: email?.split("@")[0] ?? null },
    });

    return { ok: true, claimedSessions: [...sessionIds] };
  }
}
