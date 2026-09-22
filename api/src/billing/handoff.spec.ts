import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

jest.mock("../prisma/prisma.module", () => ({
  PrismaService: class PrismaService {},
}));

import { HandoffService } from "./handoff.service";

type PrismaMock = {
  checkoutHandoff: {
    create: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  handoffRateLimit: {
    upsert: jest.Mock;
  };
};

function prismaMock(): PrismaMock {
  return {
    checkoutHandoff: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    handoffRateLimit: {
      upsert: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function handoffRecord(secretHash: string, overrides: Record<string, unknown> = {}) {
  return {
    id: "handoff-1",
    secretHash,
    email: "buyer@example.com",
    offerId: "focus_1.00_3d_28.99_28d",
    funnelSessionId: "funnel-session-1",
    reportPath: "/iq-report",
    status: "paid",
    providerTxId: "tx-1",
    cognitoUserId: "cognito-user-1",
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("HandoffService", () => {
  const previousSecret = process.env.REPORT_GRANT_SECRET;

  beforeEach(() => {
    process.env.REPORT_GRANT_SECRET = "test-report-grant-secret-at-least-32-bytes";
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.REPORT_GRANT_SECRET;
    else process.env.REPORT_GRANT_SECRET = previousSecret;
  });

  it("creates a handoff, returns the raw secret, and stores only its hash", async () => {
    const prisma = prismaMock();
    prisma.checkoutHandoff.create.mockResolvedValue({ id: "handoff-1" });
    const service = new HandoffService(prisma as never);

    const result = await service.create({
      email: " Buyer@Example.com ",
      offerId: "offer-1",
      funnelSessionId: "session-1",
      ip: "203.0.113.1",
    });

    expect(result.handoffSecret).toMatch(/^[a-f0-9]{64}$/);
    const stored = prisma.checkoutHandoff.create.mock.calls[0][0].data;
    expect(stored.email).toBe("buyer@example.com");
    expect(stored.secretHash).not.toBe(result.handoffSecret);
    await expect(
      bcrypt.compare(result.handoffSecret ?? "", stored.secretHash),
    ).resolves.toBe(true);
  });

  it("returns a null secret when creation fails", async () => {
    const prisma = prismaMock();
    prisma.checkoutHandoff.create.mockRejectedValue(new Error("db unavailable"));
    const service = new HandoffService(prisma as never);

    await expect(
      service.create({
        email: "buyer@example.com",
        offerId: "offer-1",
        funnelSessionId: "session-1",
        ip: "203.0.113.2",
      }),
    ).resolves.toEqual({ handoffSecret: null });
  });

  it("exchanges a valid secret once for a 15-minute report grant", async () => {
    const secret = "a".repeat(64);
    const hash = await bcrypt.hash(secret, 4);
    const prisma = prismaMock();
    prisma.checkoutHandoff.findMany.mockResolvedValue([handoffRecord(hash)]);
    prisma.checkoutHandoff.updateMany.mockResolvedValue({ count: 1 });
    const service = new HandoffService(prisma as never);

    const result = await service.exchange({
      handoffSecret: secret,
      ip: "203.0.113.3",
    });

    const payload = jwt.verify(
      result.reportGrant,
      process.env.REPORT_GRANT_SECRET as string,
    ) as jwt.JwtPayload;
    expect(result.reportPath).toBe("/iq-report");
    expect(result.funnelSessionId).toBe("funnel-session-1");
    expect(payload.userId).toBe("cognito-user-1");
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(15 * 60);
  });

  it.each(["consumed", "expired"])(
    "rejects a %s handoff",
    async () => {
      const prisma = prismaMock();
      prisma.checkoutHandoff.findMany.mockResolvedValue([]);
      const service = new HandoffService(prisma as never);

      await expect(
        service.exchange({ handoffSecret: "b".repeat(64), ip: "203.0.113.4" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it("rejects a wrong secret", async () => {
    const hash = await bcrypt.hash("c".repeat(64), 4);
    const prisma = prismaMock();
    prisma.checkoutHandoff.findMany.mockResolvedValue([handoffRecord(hash)]);
    const service = new HandoffService(prisma as never);

    await expect(
      service.exchange({ handoffSecret: "d".repeat(64), ip: "203.0.113.5" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.checkoutHandoff.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a replay when the conditional consume loses the race", async () => {
    const secret = "e".repeat(64);
    const hash = await bcrypt.hash(secret, 4);
    const prisma = prismaMock();
    prisma.checkoutHandoff.findMany.mockResolvedValue([handoffRecord(hash)]);
    prisma.checkoutHandoff.updateMany.mockResolvedValue({ count: 0 });
    const service = new HandoffService(prisma as never);

    await expect(
      service.exchange({ handoffSecret: secret, ip: "203.0.113.6" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});