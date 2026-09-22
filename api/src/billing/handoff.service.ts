import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.module";

const HANDOFF_LIFETIME_MS = 2 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const REPORT_GRANT_TTL_SECONDS = 15 * 60;

@Injectable()
export class HandoffService {
  constructor(private prisma: PrismaService) {}

  async create(input: {
    email: string;
    offerId: string;
    funnelSessionId: string;
    ip: string;
  }): Promise<{ handoffSecret: string | null }> {
    await this.enforceRateLimit("create", input.ip, 5);
    try {
      const secret = randomBytes(32).toString("hex");
      const secretHash = await bcrypt.hash(secret, 12);
      await this.prisma.checkoutHandoff.create({
        data: {
          secretHash,
          email: input.email.trim().toLowerCase(),
          offerId: input.offerId.trim(),
          funnelSessionId: input.funnelSessionId.trim(),
          status: "pending",
          expiresAt: new Date(Date.now() + HANDOFF_LIFETIME_MS),
        },
      });
      return { handoffSecret: secret };
    } catch (error) {
      console.warn("[handoff] create failed", {
        error: error instanceof Error ? error.name : "unknown",
      });
      return { handoffSecret: null };
    }
  }

  async exchange(input: {
    handoffSecret: string;
    ip: string;
  }): Promise<{
    reportGrant: string;
    reportPath: string;
    funnelSessionId: string;
  }> {
    await this.enforceRateLimit("exchange", input.ip, 10);
    const signingSecret = process.env.REPORT_GRANT_SECRET?.trim();
    if (!signingSecret || signingSecret === "REPLACE_ME") {
      throw new ServiceUnavailableException("Report grant is not configured");
    }
    const now = new Date();
    const candidates = await this.prisma.checkoutHandoff.findMany({
      where: {
        status: "paid",
        consumedAt: null,
        expiresAt: { gt: now },
        NOT: { cognitoUserId: null },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const handoff of candidates) {
      const matches = await bcrypt.compare(
        input.handoffSecret,
        handoff.secretHash,
      );
      if (!matches || !handoff.cognitoUserId) continue;

      const consumed = await this.prisma.checkoutHandoff.updateMany({
        where: {
          id: handoff.id,
          status: "paid",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { status: "consumed", consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException("invalid or expired handoff");
      }

      const reportGrant = jwt.sign(
        {
          userId: handoff.cognitoUserId,
          reportPath: handoff.reportPath,
          funnelSessionId: handoff.funnelSessionId,
        },
        signingSecret,
        { expiresIn: REPORT_GRANT_TTL_SECONDS },
      );
      return {
        reportGrant,
        reportPath: handoff.reportPath,
        funnelSessionId: handoff.funnelSessionId,
      };
    }

    throw new UnauthorizedException("invalid or expired handoff");
  }

  private async enforceRateLimit(
    action: "create" | "exchange",
    ip: string,
    limit: number,
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(
      Math.floor(now.getTime() / RATE_WINDOW_MS) * RATE_WINDOW_MS,
    );
    const expiresAt = new Date(windowStart.getTime() + RATE_WINDOW_MS * 2);
    const ipHash = createHash("sha256").update(ip || "unknown").digest("hex");
    const key = `${action}:${ipHash}:${windowStart.toISOString()}`;

    const counter = await this.prisma.handoffRateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart, expiresAt },
      update: { count: { increment: 1 } },
    });
    if (counter.count > limit) {
      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }
  }
}