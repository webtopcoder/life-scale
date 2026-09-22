import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  ForbiddenException,
  UnauthorizedException,
  GoneException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { IsEmail, IsIn, IsOptional, IsString, ValidateIf } from "class-validator";
import type { Request } from "express";
import { Public, CurrentUser, type AuthUser } from "../auth/auth.module";
import { PrismaService } from "../prisma/prisma.module";
import { BillingService } from "./billing.service";
import { verifyLifeScaleSignature } from "./life-scale-offers";
import { PartnerOtpService } from "../partner/partner-otp.service";

class CheckoutIntentDto {
  @IsString() offerId!: string;
  @IsIn(["insight", "guide", "focus", "complete"])
  subscriptionTier!: "insight" | "guide" | "focus" | "complete";
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  entitledBranch?: string | null;
}

class AddonUpsellDto {
  @IsString() addonKey!: string;
}

class CancelOtpDto {
  @IsEmail() email!: string;
}

class VerifyOtpDto {
  @IsEmail() email!: string;
  @IsString() otp!: string;
}

class CancelSubDto {
  @IsString() subscriptionId!: string;
  @IsString() otp!: string;
  /** Same email used for cancel OTP (Cognito access tokens often omit email). */
  @IsEmail() email!: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;
}

class PauseSubDto {
  @IsString() subscriptionId!: string;
  @IsString() otp!: string;
  /** Same email used for cancel/pause OTP. */
  @IsEmail() email!: string;
  @IsOptional() @IsString() pauseTill?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() comment?: string;
}

@Controller("billing")
export class BillingController {
  constructor(
    private billing: BillingService,
    private prisma: PrismaService,
    private otp: PartnerOtpService,
  ) {}

  @Post("checkout-intent")
  async checkoutIntent(
    @CurrentUser() user: AuthUser,
    @Body() body: CheckoutIntentDto,
  ) {
    const intent = await this.billing.saveCheckoutIntent({
      userId: user.sub,
      email: user.email,
      offerId: body.offerId,
      subscriptionTier: body.subscriptionTier,
      entitledBranch: body.entitledBranch ?? null,
    });
    return { ok: true, id: intent.id };
  }

  /**
   * After the Life-Scale widget redirects to /thank-you, the SPA calls this so
   * entitlement is granted even when the partner webhook is delayed/missing.
   */
  @Post("confirm-checkout")
  async confirmCheckout(
    @CurrentUser() user: AuthUser,
    @Body() body: { offerId?: string },
  ) {
    return this.billing.confirmCheckoutFromIntent({
      userId: user.sub,
      email: user.email,
      offerId: body?.offerId ?? null,
    });
  }

  /** Open an in-app add-on checkout intent before the Life-Scale widget loads. */
  @Post("addon-intent")
  async addonIntent(
    @CurrentUser() user: AuthUser,
    @Body() body: AddonUpsellDto,
  ) {
    if (!body?.addonKey?.trim()) {
      throw new BadRequestException("addonKey is required");
    }
    const intent = await this.billing.saveAddonCheckoutIntent({
      userId: user.sub,
      email: user.email,
      addonKey: body.addonKey.trim(),
    });
    return { ok: true, id: intent.id };
  }

  /**
   * After the upsell widget redirects to the report view, grant entitlement
   * when the partner webhook is delayed or sends a non-upsell event name.
   */
  @Post("confirm-addon")
  async confirmAddon(
    @CurrentUser() user: AuthUser,
    @Body() body: AddonUpsellDto,
  ) {
    if (!body?.addonKey?.trim()) {
      throw new BadRequestException("addonKey is required");
    }
    return this.billing.confirmAddonFromIntent({
      userId: user.sub,
      addonKey: body.addonKey.trim(),
    });
  }

  /**
   * In-app add-on purchase: charges the subscriber's saved card via Life-Scale
   * `POST /api/upsell` (no widget). Body.addonKey is the catalog key.
   */
  @Post("addon-upsell")
  async addonUpsell(
    @CurrentUser() user: AuthUser,
    @Body() body: AddonUpsellDto,
  ) {
    if (!body?.addonKey?.trim()) {
      throw new BadRequestException("addonKey is required");
    }
    return this.billing.purchaseAddonUpsell({
      userId: user.sub,
      addonKey: body.addonKey.trim(),
    });
  }

  /** @deprecated Breeze checkout sessions — use Life-Scale widget. */
  @Public()
  @Post("checkout-session")
  async createSession() {
    throw new GoneException(
      "Breeze checkout is retired. Use the Life-Scale checkout widget.",
    );
  }

  /** @deprecated */
  @Public()
  @Post("checkout-status")
  async status() {
    throw new GoneException(
      "Breeze checkout is retired. Use the Life-Scale checkout widget.",
    );
  }

  /** @deprecated */
  @Public()
  @Post("verify-payment")
  async verify() {
    throw new GoneException(
      "Breeze verify-payment is retired. Entitlements are granted via Life-Scale webhooks.",
    );
  }

  /** @deprecated Kept for one release; returns 410. */
  @Public()
  @Post("webhooks/breeze")
  async breezeWebhook() {
    throw new GoneException("Breeze webhooks are retired. Use /billing/webhooks/lifescale.");
  }

  @Public()
  @Post("webhooks/lifescale")
  async lifeScaleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-lifescale-signature") signature?: string,
    @Body() body?: Record<string, unknown>,
  ) {
    const secret = process.env.LIFESCALE_WEBHOOK_SECRET?.trim();
    if (!secret || secret === "REPLACE_ME") {
      console.error("[lifescale-webhook] secret not configured (missing or REPLACE_ME)");
      throw new UnauthorizedException("Webhook secret not configured");
    }

    const rawBody =
      req.rawBody ??
      Buffer.from(typeof body === "string" ? body : JSON.stringify(body ?? {}));

    if (!verifyLifeScaleSignature(rawBody, signature, secret)) {
      console.warn("[lifescale-webhook] invalid signature", {
        hasHeader: Boolean(signature),
        headerPrefix: signature?.slice(0, 12) ?? null,
        rawBodyBytes: Buffer.isBuffer(rawBody) ? rawBody.length : Buffer.byteLength(rawBody),
        event: body?.event ?? null,
        eventId: body?.event_id ?? null,
      });
      throw new UnauthorizedException("Invalid signature");
    }

    const event = String(body?.event ?? "");
    if (event === "checkout.failed") {
      console.warn("[lifescale-webhook] checkout.failed", body?.data);
      return { received: true };
    }

    await this.billing.handleLifeScaleWebhook({
      event,
      event_id: body?.event_id as string | undefined,
      data: (body?.data ?? {}) as {
        customer_id?: string;
        transaction_id?: string;
        status?: string;
        amount?: number;
        offer_id?: string;
        email?: string;
      },
    });

    return { received: true };
  }

  @Post("send-cancel-otp")
  async sendCancelOtp(
    @CurrentUser() user: AuthUser,
    @Body() body: CancelOtpDto,
  ) {
    const requestEmail = this.otp.normalizeEmail(body.email);
    if (user.email && this.otp.normalizeEmail(user.email) !== requestEmail) {
      throw new UnauthorizedException();
    }
    const { otp } = await this.otp.sendOtp(requestEmail, {
      subject: "Your cancellation verification code",
    });
    return {
      ok: true,
      ...(this.otp.isNonProduction() ? { debugOtp: otp } : {}),
    };
  }

  @Post("verify-cancel-otp")
  async verifyCancelOtp(
    @CurrentUser() user: AuthUser,
    @Body() body: VerifyOtpDto,
  ) {
    const requestEmail = this.otp.normalizeEmail(body.email);
    if (user.email && this.otp.normalizeEmail(user.email) !== requestEmail) {
      throw new UnauthorizedException();
    }
    await this.otp.verifyOtp(requestEmail, body.otp);
    return { ok: true, valid: true };
  }

  private async assertOwnedSubscription(
    userId: string,
    subscriptionId: string,
  ) {
    const owned = await this.prisma.userPurchase.findFirst({
      where: { userId, ffSubscriptionId: subscriptionId },
    });
    if (!owned) {
      throw new ForbiddenException(
        "Subscription not found for this account or access denied",
      );
    }
    return owned;
  }

  /** Prefer body email (OTP key); if JWT has email, require they match. */
  private resolveCancelEmail(user: AuthUser, bodyEmail: string): string {
    const requestEmail = this.otp.normalizeEmail(bodyEmail);
    if (user.email && this.otp.normalizeEmail(user.email) !== requestEmail) {
      throw new UnauthorizedException();
    }
    return requestEmail;
  }

  @Post("cancel-subscription")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Body() body: CancelSubDto,
  ) {
    const email = this.resolveCancelEmail(user, body.email);

    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);
    await this.assertOwnedSubscription(user.sub, body.subscriptionId);

    // body.subscriptionId is Life-Scale customer_id (ff_subscription_id).
    const result = await this.billing.cancelSubscription(body.subscriptionId, {
      email,
    });
    if (body.reason) {
      await this.prisma.cancellationFeedback.create({
        data: {
          userId: user.sub,
          email,
          reason: body.reason,
          comment: body.comment,
          subscriptionId: body.subscriptionId,
          source: "help",
        },
      });
    }
    return result;
  }

  @Post("pause-subscription")
  async pause(
    @CurrentUser() user: AuthUser,
    @Body() body: PauseSubDto,
  ) {
    const email = this.resolveCancelEmail(user, body.email);

    await this.otp.assertVerifiedOtpWithinWindow(email, body.otp);
    await this.assertOwnedSubscription(user.sub, body.subscriptionId);

    // Temporarily disabled — re-enable by restoring billing.pauseSubscription call.
    throw new HttpException(
      {
        error:
          "Pause is not currently available. Cancel the subscription via cancel-subscription or contact support.",
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
