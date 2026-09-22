-- CreateTable
CREATE TABLE "checkout_handoffs" (
    "id" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "funnel_session_id" TEXT NOT NULL,
    "report_path" TEXT NOT NULL DEFAULT '/iq-report',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider_tx_id" TEXT,
    "cognito_user_id" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "handoff_rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "checkout_handoffs_secret_hash_key" ON "checkout_handoffs"("secret_hash");

-- CreateIndex
CREATE INDEX "checkout_handoffs_email_offer_id_status_idx" ON "checkout_handoffs"("email", "offer_id", "status");

-- CreateIndex (explicit per schema; the unique index above also supports this lookup)
CREATE INDEX "checkout_handoffs_secret_hash_idx" ON "checkout_handoffs"("secret_hash");

-- CreateIndex
CREATE INDEX "handoff_rate_limits_expires_at_idx" ON "handoff_rate_limits"("expires_at");