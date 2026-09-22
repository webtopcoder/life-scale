import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { CurrentUser, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import {
  BillingService,
  BREEZE_API_BASE,
  breezeJsonHeaders,
} from "../billing/billing.service";
import { isLifeScaleApiConfigured } from "../billing/life-scale-api";
import { PartnerOtpService } from "./partner-otp.service";

@Injectable()
export class PartnerApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers["x-api-key"];
    const expected = process.env.PARTNER_API_KEY;
    if (!expected || expected === "REPLACE_ME" || key !== expected) {
      throw new UnauthorizedException("Invalid API key");
    }
    return true;
  }
}

class PartnerOtpDto {
  @IsString() otp!: string;
}

class PartnerRefundDto {
  @IsString() otp!: string;
  @IsString() order_id!: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsNumber() @Min(0.01) amount?: number;
  @IsOptional() @IsBoolean() soft_refund?: boolean;
}

class PartnerCancelDto {
  @IsString() otp!: string;
  @IsString() subs_id!: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;
}

class PartnerPauseDto {
  @IsString() otp!: string;
  @IsString() subs_id!: string;
  @IsOptional() @IsString() pause_till?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;
}

@Controller("partner")
@UseGuards(PartnerApiKeyGuard)
export class PartnerController {
  constructor(
    private prisma: PrismaService,
    private billing: BillingService,
    private otp: PartnerOtpService,
  ) {}

  private requireEmail(user: AuthUser): string {
    if (!user.email) {
      throw new UnauthorizedException("User email is required for MFA");
    }
    return this.otp.normalizeEmail(user.email);
  }

  @Post("validate-user")
  async validateUser(@CurrentUser() user: AuthUser) {
    return {
      valid: true,
      user_id: user.sub,
      email: user.email ?? null,
    };
  }

  @Post("send-mfa")
  async sendMfa(@CurrentUser() user: AuthUser) {
    const email = this.requireEmail(user);
    const { otp } = await this.otp.sendOtp(email);
    return {
      success: true,
      message: "Verification code sent",
      ...(this.otp.isNonProduction() ? { debugOtp: otp } : {}),
    };
  }

  @Post("verify-mfa")
  async verifyMfa(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerOtpDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.verifyOtp(email, body.otp);
    return { valid: true, message: "Verification successful" };
  }

  @Post("user-stats")
  async userStats(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerOtpDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);

    const completions = await this.prisma.testCompletion.findMany({
      where: { userId: user.sub },
      select: { branch: true },
    });
    const assessmentCount = completions.filter((c) => c.branch === "iq").length;
    const likertCount = completions.filter((c) => c.branch !== "iq").length;

    return {
      user_id: user.sub,
      email,
      assessment_count: assessmentCount,
      likert_count: likertCount,
      total: assessmentCount + likertCount,
    };
  }

  @Post("user-assets")
  async userAssets(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerOtpDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);

    const purchases = await this.prisma.userPurchase.findMany({
      where: { userId: user.sub },
      orderBy: { purchasedAt: "desc" },
    });

    const breezeApiKey = process.env.BREEZE_API_KEY;
    const statusBySubId = new Map<string, string | null>();
    if (breezeApiKey) {
      const subIds = [
        ...new Set(
          purchases
            .map((p) => p.ffSubscriptionId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      await Promise.all(
        subIds.map(async (sid) => {
          try {
            const status = await this.billing.checkoutStatus(undefined, sid);
            statusBySubId.set(
              sid,
              (status.status as string | undefined) ?? null,
            );
          } catch {
            statusBySubId.set(sid, null);
          }
        }),
      );
    }

    const subscriptions: Array<{
      subs_id: string;
      product_key: string;
      amount_cents: number;
      purchased_at: string;
      breeze_status: string | null;
    }> = [];
    const oneTimeOrders: Array<{
      product_key: string;
      amount_cents: number;
      purchased_at: string;
      refund_page_id: string | null;
      payment_id: string | null;
    }> = [];
    const seenSubs = new Set<string>();

    for (const row of purchases) {
      if (row.ffSubscriptionId) {
        if (seenSubs.has(row.ffSubscriptionId)) continue;
        seenSubs.add(row.ffSubscriptionId);
        subscriptions.push({
          subs_id: row.ffSubscriptionId,
          product_key: row.productKey,
          amount_cents: row.amountCents,
          purchased_at: row.purchasedAt.toISOString(),
          breeze_status: breezeApiKey
            ? (statusBySubId.get(row.ffSubscriptionId) ?? null)
            : null,
        });
      } else {
        oneTimeOrders.push({
          product_key: row.productKey,
          amount_cents: row.amountCents,
          purchased_at: row.purchasedAt.toISOString(),
          refund_page_id: row.breezePaymentPageId,
          payment_id: row.ffPaymentId,
        });
      }
    }

    return {
      source: "breeze_user_purchases",
      user_id: user.sub,
      subscriptions,
      one_time_orders: oneTimeOrders,
    };
  }

  @Post("refund-order")
  async refund(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerRefundDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);

    const orderId = body.order_id?.trim();
    if (!orderId) {
      throw new BadRequestException("order_id is required");
    }

    const purchase = await this.prisma.userPurchase.findFirst({
      where: {
        userId: user.sub,
        breezePaymentPageId: orderId,
      },
    });
    if (!purchase) {
      throw new ForbiddenException(
        "Order not found for this account or access denied",
      );
    }

    const softRefund =
      body.soft_refund === true || !process.env.BREEZE_API_KEY;

    if (softRefund) {
      await this.prisma.userPurchase.update({
        where: { id: purchase.id },
        data: { status: "refunded" },
      });
      return {
        ok: true,
        soft_refund: true,
        order_id: orderId,
        status: "refunded",
        message: "Refund recorded (soft refund / demo mode)",
      };
    }

    const apiKey = process.env.BREEZE_API_KEY!;
    const r = await fetch(
      `${BREEZE_API_BASE}/v1/payment_pages/${encodeURIComponent(orderId)}/refund`,
      {
        method: "POST",
        headers: breezeJsonHeaders(apiKey),
      },
    );
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new HttpException(
        { error: "Refund failed", details: data },
        r.status || HttpStatus.BAD_GATEWAY,
      );
    }
    await this.prisma.userPurchase.update({
      where: { id: purchase.id },
      data: { status: "refunded" },
    });
    return data;
  }

  @Post("cancel-subscription")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerCancelDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);

    const subsId = body.subs_id?.trim();
    if (!subsId) {
      throw new BadRequestException("subs_id is required");
    }

    const owned = await this.prisma.userPurchase.findFirst({
      where: { userId: user.sub, ffSubscriptionId: subsId },
    });
    if (!owned) {
      throw new ForbiddenException(
        "Subscription not found for this account or access denied",
      );
    }

    if (body.reason) {
      await this.prisma.cancellationFeedback.create({
        data: {
          userId: user.sub,
          email,
          reason: body.reason,
          comment: body.comment,
          subscriptionId: subsId,
          source: "partner",
        },
      });
    }

    if (!isLifeScaleApiConfigured()) {
      await this.prisma.userPurchase.updateMany({
        where: { userId: user.sub, ffSubscriptionId: subsId },
        data: { status: "cancelled" },
      });
      return {
        ok: true,
        soft_cancel: true,
        subs_id: subsId,
        status: "cancelled",
        message:
          "Cancellation recorded (demo mode; Life-Scale API not configured)",
      };
    }

    return this.billing.cancelSubscription(subsId, { email });
  }

  @Post("pause-subscription")
  async pause(
    @CurrentUser() user: AuthUser,
    @Body() body: PartnerPauseDto,
  ) {
    const email = this.requireEmail(user);
    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);

    const subsId = body.subs_id?.trim();
    if (!subsId) {
      throw new BadRequestException("subs_id is required");
    }

    if (body.pause_till) {
      const till = new Date(body.pause_till);
      if (Number.isNaN(till.getTime()) || till.getTime() <= Date.now()) {
        throw new BadRequestException(
          "pause_till must be a valid future ISO 8601 date string",
        );
      }
    }

    const owned = await this.prisma.userPurchase.findFirst({
      where: { userId: user.sub, ffSubscriptionId: subsId },
    });
    if (!owned) {
      throw new ForbiddenException(
        "Subscription not found for this account or access denied",
      );
    }

    throw new HttpException(
      {
        error:
          "Pause is not supported by Life-Scale. Cancel the subscription via partner-cancel-subscription or contact support.",
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
