-- CreateTable
CREATE TABLE "checkout_intents" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT,
    "offer_id" TEXT NOT NULL,
    "subscription_tier" TEXT NOT NULL,
    "entitled_branch" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMPTZ(6),

    CONSTRAINT "checkout_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifescale_webhook_events" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifescale_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkout_intents_user_id_idx" ON "checkout_intents"("user_id");

-- CreateIndex
CREATE INDEX "checkout_intents_email_idx" ON "checkout_intents"("email");

-- CreateIndex
CREATE INDEX "user_purchases_ff_subscription_id_idx" ON "user_purchases"("ff_subscription_id");

-- CreateIndex
CREATE INDEX "user_purchases_ff_payment_id_idx" ON "user_purchases"("ff_payment_id");
