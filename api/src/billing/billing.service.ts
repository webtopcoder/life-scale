import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { PrismaService } from "../prisma/prisma.module";
import { upsertProfile } from "../prisma/upsert-profile";
import {
  fetchLifeScaleAccess,
  isLifeScaleAccessActive,
  isLifeScaleApiConfigured,
  lifeScaleApiKey,
  lifeScaleBaseUrl,
  lifeScaleJsonHeaders,
  postLifeScaleCustomerCancel,
} from "./life-scale-api";
import {
  parseOfferId,
  normalizeAddonOfferId,
  toPartnerAddonOfferId,
  type LifeScaleTier,
} from "./life-scale-offers";
import { sendWelcomePasswordEmail } from "../email/sendgrid-email";

export const BREEZE_API_BASE = "https://api.breeze.cash";

export function breezeJsonHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function breezeBasicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export function verifyBreezeWebhookSignature(
  data: Record<string, unknown>,
  signature: string,
  secret: string,
): boolean {
  const payload = JSON.stringify(data);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function generatePassword(): string {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$%&*";
  const all = letters + digits;
  const chars: string[] = [];
  for (let i = 0; i < 15; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }
  chars.splice(
    Math.floor(Math.random() * 16),
    0,
    specials[Math.floor(Math.random() * specials.length)],
  );
  return chars.join("");
}

type LifeScaleEventData = {
  customer_id?: string;
  transaction_id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  offer_id?: string;
  product_name?: string;
  payment_method?: string;
  email?: string;
  next_charge_date?: string;
  billing_cycle_number?: number;
};

@Injectable()
export class BillingService {
  private cognito = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || "us-east-1",
  });

  constructor(private prisma: PrismaService) {}

  private apiKey() {
    const k = process.env.BREEZE_API_KEY;
    if (!k) throw new Error("BREEZE_API_KEY not configured");
    return k;
  }

  async saveCheckoutIntent(input: {
    userId: string;
    email?: string | null;
    offerId: string;
    subscriptionTier: LifeScaleTier;
    entitledBranch?: string | null;
  }) {
    return this.prisma.checkoutIntent.create({
      data: {
        userId: input.userId,
        email: input.email?.trim().toLowerCase() || null,
        offerId: input.offerId,
        subscriptionTier: input.subscriptionTier,
        entitledBranch: input.entitledBranch ?? null,
      },
    });
  }

  /**
   * Client-side fallback when the widget redirects to /thank-you but the
   * partner webhook is delayed or missing. Fulfills from the authenticated
   * user's open checkout intent (created before the widget loaded).
   */
  async confirmCheckoutFromIntent(input: {
    userId: string;
    email?: string | null;
    offerId?: string | null;
  }) {
    const existing = await this.prisma.userPurchase.findFirst({
      where: {
        userId: input.userId,
        productKey: "iq_subscription",
        status: "active",
      },
    });
    if (existing) {
      return { ok: true as const, alreadyActive: true, purchaseId: existing.id };
    }

    const intent = await this.prisma.checkoutIntent.findFirst({
      where: {
        userId: input.userId,
        consumedAt: null,
        ...(input.offerId ? { offerId: input.offerId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!intent) {
      return { ok: false as const, reason: "no_intent" as const };
    }

    const parsed = parseOfferId(intent.offerId);
    let tier: LifeScaleTier =
      (intent.subscriptionTier as LifeScaleTier) || parsed?.tier || "insight";
    let entitledBranch =
      tier === "complete" ? null : (intent.entitledBranch ?? null);

    await upsertProfile(this.prisma, input.userId, {
      create: {
        displayName: input.email?.split("@")[0] || null,
        subscriptionTier: tier,
        entitledBranch,
        hasUsedTrial: true,
      },
      update: {
        subscriptionTier: tier,
        entitledBranch,
        hasUsedTrial: true,
      },
    });

    const purchase = await this.prisma.userPurchase.create({
      data: {
        productKey: "iq_subscription",
        amountCents: parsed?.introCents ?? 0,
        status: "active",
        userId: input.userId,
      },
    });

    await this.prisma.checkoutIntent.update({
      where: { id: intent.id },
      data: { consumedAt: new Date() },
    });

    console.log("[lifescale] confirmCheckoutFromIntent", {
      userId: input.userId,
      intentId: intent.id,
      offerId: intent.offerId,
      tier,
      purchaseId: purchase.id,
    });

    return { ok: true as const, alreadyActive: false, purchaseId: purchase.id };
  }

  /**
   * Record that the user opened in-app add-on checkout (before the widget).
   * Consumed by confirmAddonFromIntent if the webhook is delayed/missing.
   */
  async saveAddonCheckoutIntent(input: {
    userId: string;
    email?: string | null;
    addonKey: string;
  }) {
    const addonKey =
      normalizeAddonOfferId(input.addonKey) || input.addonKey.trim();
    if (!addonKey.startsWith("addon_")) {
      throw new Error("Invalid addonKey");
    }
    return this.prisma.checkoutIntent.create({
      data: {
        userId: input.userId,
        email: input.email?.trim().toLowerCase() || null,
        offerId: addonKey,
        subscriptionTier: "addon",
        entitledBranch: null,
      },
    });
  }

  /**
   * After the upsell widget redirects to the add-on report view, grant the
   * entitlement from a recent addon intent when the partner webhook is late.
   */
  async confirmAddonFromIntent(input: {
    userId: string;
    addonKey: string;
  }) {
    const addonKey =
      normalizeAddonOfferId(input.addonKey) || input.addonKey.trim();
    if (!addonKey.startsWith("addon_")) {
      return { ok: false as const, reason: "invalid_key" as const };
    }

    const already = await this.prisma.userPurchase.findFirst({
      where: {
        userId: input.userId,
        productKey: addonKey,
        status: "active",
      },
    });
    if (already) {
      return {
        ok: true as const,
        alreadyOwned: true,
        purchaseId: already.id,
        productKey: addonKey,
      };
    }

    const intent = await this.prisma.checkoutIntent.findFirst({
      where: {
        userId: input.userId,
        offerId: addonKey,
        subscriptionTier: "addon",
        consumedAt: null,
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!intent) {
      return { ok: false as const, reason: "no_intent" as const };
    }

    const sub = await this.prisma.userPurchase.findFirst({
      where: {
        userId: input.userId,
        productKey: "iq_subscription",
        status: "active",
        NOT: { ffSubscriptionId: null },
      },
      orderBy: { purchasedAt: "desc" },
    });

    const purchase = await this.prisma.userPurchase.create({
      data: {
        userId: input.userId,
        productKey: addonKey,
        amountCents: 0,
        status: "active",
        ffSubscriptionId: sub?.ffSubscriptionId ?? null,
      },
    });

    await this.prisma.checkoutIntent.update({
      where: { id: intent.id },
      data: { consumedAt: new Date() },
    });

    console.log("[lifescale] confirmAddonFromIntent", {
      userId: input.userId,
      intentId: intent.id,
      addonKey,
      purchaseId: purchase.id,
    });

    return {
      ok: true as const,
      alreadyOwned: false,
      purchaseId: purchase.id,
      productKey: addonKey,
    };
  }

  async createCheckoutSession(body: Record<string, unknown>) {
    const apiKey = this.apiKey();
    const priceKey = String(body.priceKey || "IQ_SUBSCRIPTION");
    const email = body.email as string | undefined;
    const externalId = body.externalId as string | undefined;
    const returnOrigin = String(body.returnOrigin || "");
    const successPath = String(body.successPath || "/");
    const failPath = String(body.failPath || "/");

    const productEnvMap: Record<string, [string, string]> = {
      IQ_SUBSCRIPTION: [
        "BREEZE_IQ_SUBSCRIPTION_PRODUCT_ID",
        "BREEZE_IQ_SUBSCRIPTION_RECURRING_PRICE_ID",
      ],
      IQ_SUBSCRIPTION_ALT: [
        "BREEZE_IQ_ALT_SUBSCRIPTION_PRODUCT_ID",
        "BREEZE_IQ_ALT_SUBSCRIPTION_RECURRING_PRICE_ID",
      ],
      IQ_SUBSCRIPTION_BOA: [
        "BREEZE_IQ_BOA_SUBSCRIPTION_PRODUCT_ID",
        "BREEZE_IQ_BOA_SUBSCRIPTION_RECURRING_PRICE_ID",
      ],
      IQ_SUBSCRIPTION_RVR: [
        "BREEZE_IQ_RVR_SUBSCRIPTION_PRODUCT_ID",
        "BREEZE_IQ_RVR_SUBSCRIPTION_RECURRING_PRICE_ID",
      ],
      WEAKNESS_REPORT: [
        "BREEZE_WEAKNESS_REPORT_PRODUCT_ID",
        "BREEZE_WEAKNESS_REPORT_PRICE_ID",
      ],
      GENIUS_BLUEPRINT: [
        "BREEZE_GENIUS_BLUEPRINT_PRODUCT_ID",
        "BREEZE_GENIUS_BLUEPRINT_PRICE_ID",
      ],
      BRAIN_COACH: [
        "BREEZE_BRAIN_COACH_PRODUCT_ID",
        "BREEZE_BRAIN_COACH_PRICE_ID",
      ],
    };
    const [prodEnv, priceEnv] =
      productEnvMap[priceKey] || productEnvMap.IQ_SUBSCRIPTION;
    const productId = process.env[prodEnv];
    const priceId = process.env[priceEnv];
    if (!productId || !priceId) {
      throw new Error(`Missing product/price env for ${priceKey}`);
    }

    const successUrl = `${returnOrigin}${successPath}${successPath.includes("?") ? "&" : "?"}breezePayment=success`;
    const failUrl = `${returnOrigin}${failPath}${failPath.includes("?") ? "&" : "?"}breezePayment=failed`;

    const isSubscription = priceKey.startsWith("IQ_SUBSCRIPTION");
    if (isSubscription) {
      const r = await fetch(`${BREEZE_API_BASE}/v1/subscriptions`, {
        method: "POST",
        headers: breezeJsonHeaders(apiKey),
        body: JSON.stringify({
          productId,
          priceId,
          email,
          referenceId: externalId,
          successUrl,
          cancelUrl: failUrl,
          metadata: body.metadata ?? {},
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(json));
      return {
        breezePageId: json.id ?? json.paymentPageId,
        checkoutUrl: json.url ?? json.checkoutUrl,
        subscriptionId: json.id ?? json.subscriptionId,
        raw: json,
      };
    }

    const r = await fetch(`${BREEZE_API_BASE}/v1/payment_pages`, {
      method: "POST",
      headers: breezeJsonHeaders(apiKey),
      body: JSON.stringify({
        productId,
        priceId,
        email,
        referenceId: externalId,
        successUrl,
        cancelUrl: failUrl,
      }),
    });
    const json = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(json));
    return {
      breezePageId: json.id ?? json.paymentPageId,
      checkoutUrl: json.url ?? json.checkoutUrl,
      raw: json,
    };
  }

  async checkoutStatus(pageId?: string, subscriptionId?: string) {
    const apiKey = this.apiKey();
    if (subscriptionId) {
      const r = await fetch(
        `${BREEZE_API_BASE}/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
        { headers: { Authorization: breezeBasicAuthHeader(apiKey) } },
      );
      const json = await r.json();
      return { status: json.status, raw: json };
    }
    if (!pageId) throw new Error("pageId or subscriptionId required");
    const r = await fetch(
      `${BREEZE_API_BASE}/v1/payment_pages/${encodeURIComponent(pageId)}`,
      { headers: { Authorization: breezeBasicAuthHeader(apiKey) } },
    );
    const json = await r.json();
    return { status: json.status, raw: json };
  }

  async handleLifeScaleWebhook(payload: {
    event: string;
    event_id?: string;
    data?: LifeScaleEventData;
  }) {
    const event = String(payload.event || "");
    const eventId = payload.event_id?.trim();
    const data = payload.data ?? {};
    const parsedPreview = data.offer_id ? parseOfferId(data.offer_id) : null;
    const amountCentsFromWebhook =
      typeof data.amount === "number"
        ? Math.round(data.amount * 100)
        : null;
    const amountCentsResolved =
      amountCentsFromWebhook ?? parsedPreview?.introCents ?? 0;

    console.log("[lifescale-webhook] received", {
      event,
      eventId: eventId ?? null,
      amount: data.amount ?? null,
      amountCentsFromWebhook,
      amountCentsResolved,
      amountSource:
        typeof data.amount === "number"
          ? "data.amount * 100"
          : parsedPreview
            ? "offer_id.introCents"
            : "none",
      offer_id: data.offer_id ?? null,
      parsedIntroCents: parsedPreview?.introCents ?? null,
      email: data.email ?? null,
      customer_id: data.customer_id ?? null,
      transaction_id: data.transaction_id ?? null,
      currency: data.currency ?? null,
      product_name: data.product_name ?? null,
    });

    if (eventId) {
      const existing = await this.prisma.lifescaleWebhookEvent.findUnique({
        where: { id: eventId },
      });
      if (existing) {
        console.log("[lifescale-webhook] duplicate event", { eventId, event });
        return { ok: true, duplicate: true };
      }
    }

    const offerId = data.offer_id?.trim() || "";
    const isAddonOffer = this.isAddonOfferId(offerId);

    if (
      event === "upsell.completed" ||
      (isAddonOffer &&
        (event === "subscription.rebilled" || event === "checkout.completed"))
    ) {
      // Partner sometimes fires subscription.rebilled (or checkout.completed) for
      // one-time add-on charges on a saved card — route by offer_id, not only event name.
      await this.fulfillLifeScaleAddonUpsell(data);
    } else if (event === "checkout.completed") {
      await this.fulfillLifeScaleCheckout(data, {
        productKey: "iq_subscription",
      });
    } else if (event === "subscription.rebilled") {
      await this.markLifeScalePurchaseStatus(data, "active");
    } else if (event === "subscription.payment_failed") {
      await this.markLifeScalePurchaseStatus(data, "past_due");
    } else if (event === "subscription.cancelled") {
      await this.markLifeScalePurchaseStatus(data, "cancelled");
    } else {
      console.warn("[lifescale-webhook] unhandled event", {
        event,
        offer_id: offerId || null,
        customer_id: data.customer_id ?? null,
      });
    }

    if (eventId) {
      await this.prisma.lifescaleWebhookEvent.create({
        data: {
          id: eventId,
          event,
          payload: data as object,
        },
      });
    }

    return { ok: true };
  }

  private isAddonOfferId(offerId: string | undefined | null): boolean {
    const raw = offerId?.trim() || "";
    if (!raw) return false;
    const normalized = normalizeAddonOfferId(raw) || raw;
    return normalized.startsWith("addon_");
  }

  private async markLifeScalePurchaseStatus(
    data: LifeScaleEventData,
    status: string,
  ) {
    const customerId = data.customer_id?.trim();
    const transactionId = data.transaction_id?.trim();
    if (!customerId && !transactionId) return;

    await this.prisma.userPurchase.updateMany({
      where: {
        OR: [
          ...(customerId ? [{ ffSubscriptionId: customerId }] : []),
          ...(transactionId ? [{ ffPaymentId: transactionId }] : []),
        ],
      },
      data: { status },
    });
  }

  async fulfillLifeScaleCheckout(
    data: LifeScaleEventData,
    opts?: { productKey?: string },
  ) {
    const email = data.email?.trim().toLowerCase() || "";
    const offerId = data.offer_id?.trim() || "";
    const parsed = offerId ? parseOfferId(offerId) : null;
    const customerId = data.customer_id?.trim() || null;
    const transactionId = data.transaction_id?.trim() || null;
    const amountCents =
      typeof data.amount === "number"
        ? Math.round(data.amount * 100)
        : (parsed?.introCents ?? 0);

    console.log("[lifescale-webhook] fulfill amount", {
      email: email || null,
      offerId: offerId || null,
      rawAmount: data.amount ?? null,
      amountCents,
      amountSource:
        typeof data.amount === "number"
          ? "data.amount * 100"
          : parsed
            ? "offer_id.introCents"
            : "none",
      parsedIntroCents: parsed?.introCents ?? null,
      customerId,
      transactionId,
    });

    let userId: string | null = null;
    let autoPassword: string | undefined;
    let createdUser = false;

    if (email && process.env.COGNITO_USER_POOL_ID) {
      const existing = await this.findCognitoUserByEmail(email);
      if (existing) {
        userId = existing;
      } else {
        autoPassword = generatePassword();
        userId = await this.createCognitoUser(email, autoPassword);
        createdUser = true;
        try {
          await sendWelcomePasswordEmail(email, autoPassword);
          console.log(
            "[lifescale-webhook] welcome credentials email sent to",
            email,
          );
        } catch (emailErr) {
          console.error(
            "[lifescale-webhook] welcome credentials email failed:",
            emailErr,
          );
        }
      }
    }

    let tier: LifeScaleTier = parsed?.tier ?? "insight";
    let entitledBranch: string | null = null;

    const intent = await this.findLatestCheckoutIntent({
      userId,
      email,
      offerId,
    });
    if (intent) {
      tier = (intent.subscriptionTier as LifeScaleTier) || tier;
      entitledBranch = intent.entitledBranch;
      await this.prisma.checkoutIntent.update({
        where: { id: intent.id },
        data: { consumedAt: new Date() },
      });
    } else if (userId) {
      const profile = await this.prisma.profile.findUnique({
        where: { userId },
      });
      if (profile?.entitledBranch) entitledBranch = profile.entitledBranch;
    }

    if (tier === "complete") entitledBranch = null;

    if (userId) {
      await upsertProfile(this.prisma, userId, {
        create: {
          displayName: email.split("@")[0] || null,
          subscriptionTier: tier,
          entitledBranch,
          hasUsedTrial: true,
        },
        update: {
          subscriptionTier: tier,
          entitledBranch,
          hasUsedTrial: true,
        },
      });
    }

    const productKey = opts?.productKey || "iq_subscription";
    const existingPurchase = await this.prisma.userPurchase.findFirst({
      where: {
        OR: [
          ...(transactionId ? [{ ffPaymentId: transactionId }] : []),
          ...(customerId && productKey === "iq_subscription"
            ? [{ ffSubscriptionId: customerId, productKey: "iq_subscription" }]
            : []),
        ],
      },
    });

    if (existingPurchase) {
      await this.prisma.userPurchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: "active",
          userId: userId ?? existingPurchase.userId,
          amountCents: amountCents || existingPurchase.amountCents,
          ffSubscriptionId: customerId ?? existingPurchase.ffSubscriptionId,
          ffPaymentId: transactionId ?? existingPurchase.ffPaymentId,
        },
      });
    } else {
      await this.prisma.userPurchase.create({
        data: {
          productKey,
          amountCents,
          status: "active",
          userId,
          ffSubscriptionId: customerId,
          ffPaymentId: transactionId,
        },
      });
    }

    if (email && offerId && userId) {
      try {
        const handoff = await this.prisma.checkoutHandoff.findFirst({
          where: {
            email,
            offerId,
            status: "pending",
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });
        if (handoff) {
          const bound = await this.prisma.checkoutHandoff.updateMany({
            where: { id: handoff.id, status: "pending" },
            data: {
              status: "paid",
              providerTxId: transactionId,
              cognitoUserId: userId,
            },
          });
          if (bound.count === 1) {
            console.log("[lifescale-webhook] handoff bound to transaction", {
              handoffId: handoff.id,
              transactionId,
            });
          }
        }
      } catch (error) {
        console.warn("[lifescale-webhook] handoff binding skipped", {
          error: error instanceof Error ? error.name : "unknown",
        });
      }
    }

    return { userId, autoPassword, createdUser, tier };
  }

  /**
   * One-time add-on from `upsell.completed` (widget or dashboard API).
   * Does not change subscription tier / entitled branch.
   */
  async fulfillLifeScaleAddonUpsell(data: LifeScaleEventData) {
    const email = data.email?.trim().toLowerCase() || "";
    const offerId = data.offer_id?.trim() || "";
    const customerId = data.customer_id?.trim() || null;
    const transactionId = data.transaction_id?.trim() || null;
    const productKey =
      normalizeAddonOfferId(offerId) || offerId || "lifescale_upsell";
    const amountCents =
      typeof data.amount === "number" ? Math.round(data.amount * 100) : 0;

    let userId: string | null = null;
    if (customerId) {
      const sub = await this.prisma.userPurchase.findFirst({
        where: {
          ffSubscriptionId: customerId,
          productKey: "iq_subscription",
        },
        orderBy: { purchasedAt: "desc" },
      });
      userId = sub?.userId ?? null;
    }
    if (!userId && email && process.env.COGNITO_USER_POOL_ID) {
      userId = await this.findCognitoUserByEmail(email);
    }

    console.log("[lifescale-webhook] addon upsell", {
      email: email || null,
      offerId: offerId || null,
      productKey,
      customerId,
      transactionId,
      userId,
      amountCents,
    });

    if (transactionId) {
      const byTxn = await this.prisma.userPurchase.findFirst({
        where: { ffPaymentId: transactionId },
      });
      if (byTxn) {
        await this.prisma.userPurchase.update({
          where: { id: byTxn.id },
          data: {
            status: "active",
            userId: userId ?? byTxn.userId,
            productKey,
            amountCents: amountCents || byTxn.amountCents,
            ffSubscriptionId: customerId ?? byTxn.ffSubscriptionId,
          },
        });
        return { userId: userId ?? byTxn.userId, productKey };
      }
    }

    if (userId) {
      const existing = await this.prisma.userPurchase.findFirst({
        where: { userId, productKey },
        orderBy: { purchasedAt: "desc" },
      });
      if (existing) {
        await this.prisma.userPurchase.update({
          where: { id: existing.id },
          data: {
            status: "active",
            amountCents: amountCents || existing.amountCents,
            ffSubscriptionId: customerId ?? existing.ffSubscriptionId,
            ffPaymentId: transactionId ?? existing.ffPaymentId,
          },
        });
        return { userId, productKey };
      }
    }

    await this.prisma.userPurchase.create({
      data: {
        productKey,
        amountCents,
        status: "active",
        userId,
        ffSubscriptionId: customerId,
        ffPaymentId: transactionId,
      },
    });
    return { userId, productKey };
  }

  /**
   * In-app add-on charge via Life-Scale `POST /api/upsell` (saved card on file).
   */
  async purchaseAddonUpsell(input: { userId: string; addonKey: string }) {
    const catalogKey =
      normalizeAddonOfferId(input.addonKey) || input.addonKey.trim();
    if (!catalogKey.startsWith("addon_")) {
      throw new Error("Invalid addonKey");
    }

    const existing = await this.prisma.userPurchase.findFirst({
      where: {
        userId: input.userId,
        productKey: catalogKey,
        status: "active",
      },
    });
    if (existing) {
      return {
        ok: true as const,
        alreadyOwned: true,
        transactionId: existing.ffPaymentId,
        productKey: catalogKey,
      };
    }

    const sub = await this.prisma.userPurchase.findFirst({
      where: {
        userId: input.userId,
        productKey: "iq_subscription",
        status: "active",
        NOT: { ffSubscriptionId: null },
      },
      orderBy: { purchasedAt: "desc" },
    });
    const customerId = sub?.ffSubscriptionId?.trim();
    if (!customerId) {
      return {
        ok: false as const,
        error: "no_payment_method",
        message:
          "No saved payment method on file. Complete a subscription checkout first.",
      };
    }

    const lifeScaleBase = lifeScaleBaseUrl();
    const lifeScaleKey = lifeScaleApiKey();
    if (!lifeScaleBase || !lifeScaleKey) {
      return {
        ok: false as const,
        error: "not_configured",
        message: "Add-on billing is not configured.",
      };
    }

    const upsellOfferId = toPartnerAddonOfferId(catalogKey);
    let transactionId: string | null = null;
    let amountCents = 0;

    try {
      const r = await fetch(`${lifeScaleBase}/api/upsell`, {
        method: "POST",
        headers: lifeScaleJsonHeaders(lifeScaleKey),
        body: JSON.stringify({
          customer_id: customerId,
          upsell_offer_id: upsellOfferId,
          payment_method: "card",
        }),
      });
      const text = await r.text().catch(() => "");
      let json: Record<string, unknown> = {};
      try {
        json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        /* noop */
      }
      if (!r.ok) {
        console.warn("[billing] Life-Scale /api/upsell failed", r.status, text);
        return {
          ok: false as const,
          error: "charge_failed",
          message:
            (typeof json.message === "string" && json.message) ||
            "Payment failed. Please try again or contact support.",
        };
      }
      const success = json.success === true || json.ok === true || r.ok;
      if (!success && json.success === false) {
        return {
          ok: false as const,
          error: "charge_failed",
          message:
            (typeof json.message === "string" && json.message) ||
            "Payment was declined.",
        };
      }
      transactionId =
        (typeof json.transaction_id === "string" && json.transaction_id) ||
        (typeof json.transactionId === "string" && json.transactionId) ||
        null;
      if (typeof json.amount === "number") {
        // Partner amounts are dollars (same as webhook `amount: 1` → $1).
        amountCents = Math.round(json.amount * 100);
      }
    } catch (err) {
      console.warn("[billing] Life-Scale /api/upsell error", err);
      return {
        ok: false as const,
        error: "charge_failed",
        message: "Could not reach the payment provider.",
      };
    }

    const purchase = await this.prisma.userPurchase.create({
      data: {
        userId: input.userId,
        productKey: catalogKey,
        amountCents,
        status: "active",
        ffSubscriptionId: customerId,
        ffPaymentId: transactionId,
      },
    });

    console.log("[billing] addon-upsell recorded", {
      userId: input.userId,
      productKey: catalogKey,
      upsellOfferId,
      transactionId,
      purchaseId: purchase.id,
    });

    return {
      ok: true as const,
      alreadyOwned: false,
      transactionId,
      productKey: catalogKey,
      purchaseId: purchase.id,
    };
  }

  private async findLatestCheckoutIntent(input: {
    userId: string | null;
    email: string;
    offerId: string;
  }) {
    const or: Array<Record<string, unknown>> = [];
    if (input.userId) or.push({ userId: input.userId });
    if (input.email) or.push({ email: input.email });
    if (or.length === 0) return null;

    return this.prisma.checkoutIntent.findFirst({
      where: {
        consumedAt: null,
        OR: or,
        ...(input.offerId ? { offerId: input.offerId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async fulfillIqSubscription(input: {
    email?: string | null;
    sessionId?: string | null;
    subscriptionId?: string | null;
    paymentId?: string | null;
    amountCents?: number | null;
    breezePageId?: string | null;
    funnelSessionId?: string | null;
    clientIp?: string | null;
    productKey?: string;
    subscriptionTier?: LifeScaleTier;
    entitledBranch?: string | null;
  }) {
    const email = input.email?.trim() || "";
    let sessionId = input.sessionId?.trim() || "";
    let userId: string | null = null;
    let autoPassword: string | undefined;
    let createdUser = false;

    if (!sessionId && email) {
      const profile = await this.prisma.userProfile.findFirst({
        where: { email },
        orderBy: { createdAt: "desc" },
      });
      if (profile) sessionId = profile.sessionId;
    }

    if (email && process.env.COGNITO_USER_POOL_ID) {
      const existing = await this.findCognitoUserByEmail(email);
      if (existing) {
        userId = existing;
      } else {
        autoPassword = generatePassword();
        userId = await this.createCognitoUser(email, autoPassword);
        createdUser = true;
      }
    }

    const tier = input.subscriptionTier ?? "insight";
    const entitledBranch =
      tier === "complete" ? null : (input.entitledBranch ?? null);

    if (userId) {
      await upsertProfile(this.prisma, userId, {
        create: {
          displayName: email.split("@")[0] || null,
          subscriptionTier: tier,
          entitledBranch,
          hasUsedTrial: true,
        },
        update: {
          subscriptionTier: tier,
          entitledBranch,
          hasUsedTrial: true,
        },
      });
    }

    if (sessionId && email) {
      const session = await this.prisma.assessmentSession.findUnique({
        where: { sessionId },
      });
      if (session?.finalScore != null) {
        const existingReport = await this.prisma.userReport.findFirst({
          where: { sessionId, email },
        });
        if (!existingReport) {
          await this.prisma.userReport.create({
            data: {
              email,
              sessionId,
              finalScore: session.finalScore,
              strongestCategory: session.strongestCategory,
              scores: session.scores ?? undefined,
              percentiles: session.percentiles ?? undefined,
              userId,
              title: "IQ Report",
              testType: "iq",
            },
          });
        } else if (userId && !existingReport.userId) {
          await this.prisma.userReport.update({
            where: { id: existingReport.id },
            data: { userId },
          });
        }
      }
    }

    const productKey = input.productKey || "iq_subscription";
    const existingPurchase = await this.prisma.userPurchase.findFirst({
      where: {
        OR: [
          ...(input.subscriptionId
            ? [{ ffSubscriptionId: input.subscriptionId }]
            : []),
          ...(input.breezePageId
            ? [{ breezePaymentPageId: input.breezePageId }]
            : []),
        ],
      },
    });

    if (existingPurchase) {
      await this.prisma.userPurchase.update({
        where: { id: existingPurchase.id },
        data: {
          status: "active",
          userId: userId ?? existingPurchase.userId,
          amountCents: input.amountCents ?? existingPurchase.amountCents,
          clientIp: input.clientIp ?? existingPurchase.clientIp,
        },
      });
    } else {
      await this.prisma.userPurchase.create({
        data: {
          productKey,
          amountCents: input.amountCents ?? 0,
          status: "active",
          userId,
          ffSubscriptionId: input.subscriptionId,
          ffPaymentId: input.paymentId,
          breezePaymentPageId: input.breezePageId,
          funnelSessionId: input.funnelSessionId ?? sessionId ?? null,
          clientIp: input.clientIp,
        },
      });
    }

    return { userId, autoPassword, createdUser };
  }

  private async findCognitoUserByEmail(email: string): Promise<string | null> {
    const res = await this.cognito.send(
      new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Filter: `email = "${email}"`,
        Limit: 1,
      }),
    );
    return res.Users?.[0]?.Username ?? null;
  }

  private async createCognitoUser(
    email: string,
    password: string,
  ): Promise<string> {
    const created = await this.cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      }),
    );
    const username = created.User?.Username || email;
    await this.cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: username,
        Password: password,
        Permanent: true,
      }),
    );
    return username;
  }

  /**
   * Cancel a Life-Scale subscription by `customer_id` (stored as
   * `user_purchases.ff_subscription_id`). When LIFESCALE_API_KEY is set:
   * check GET /api/access, then POST /api/ops/customer/:id/cancel, then
   * soft-cancel locally only on success. Without the key: local soft-cancel only.
   */
  async cancelSubscription(
    customerId: string,
    opts?: { email?: string },
  ) {
    if (!isLifeScaleApiConfigured()) {
      await this.prisma.userPurchase.updateMany({
        where: { ffSubscriptionId: customerId },
        data: { status: "cancelled" },
      });
      return {
        ok: true,
        soft_cancel: true,
        status: "cancelled",
      };
    }

    let access: Awaited<ReturnType<typeof fetchLifeScaleAccess>>;
    try {
      access = await fetchLifeScaleAccess(customerId);
      if (!isLifeScaleAccessActive(access.payload) && opts?.email) {
        const byEmail = await fetchLifeScaleAccess(opts.email);
        if (isLifeScaleAccessActive(byEmail.payload)) {
          access = byEmail;
        }
      }
    } catch (err) {
      console.warn("[billing] Life-Scale access API error", err);
      throw new ServiceUnavailableException(
        "Could not reach the payment provider to verify subscription status. Please try again.",
      );
    }

    if (!isLifeScaleAccessActive(access.payload)) {
      throw new NotFoundException(
        "We couldn't find an active subscription for this account. It may already be cancelled, or billing may still be updating. Please contact support if you need help.",
      );
    }

    let cancelResult: { ok: boolean; status: number; raw: string };
    try {
      cancelResult = await postLifeScaleCustomerCancel(customerId);
    } catch (err) {
      console.warn("[billing] Life-Scale cancel API error", err);
      throw new ServiceUnavailableException(
        "Could not reach the payment provider to cancel. Please try again.",
      );
    }

    if (!cancelResult.ok) {
      console.warn(
        "[billing] Life-Scale cancel API failed",
        cancelResult.status,
        cancelResult.raw,
      );
      throw new ServiceUnavailableException(
        "Cancellation could not be completed with the payment provider. Please try again or contact support.",
      );
    }

    await this.prisma.userPurchase.updateMany({
      where: { ffSubscriptionId: customerId },
      data: { status: "cancelled" },
    });
    return {
      ok: true,
      soft_cancel: false,
      status: "cancelled",
    };
  }

  /**
   * Pause is local-only until Life-Scale publishes a pause HTTP API.
   */
  async pauseSubscription(subscriptionId: string) {
    await this.prisma.userPurchase.updateMany({
      where: { ffSubscriptionId: subscriptionId },
      data: { status: "paused" },
    });
    return {
      ok: true,
      soft_pause: true,
      status: "paused",
    };
  }
}
