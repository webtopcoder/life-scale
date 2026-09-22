-- CreateTable
CREATE TABLE "support_chat_conversations" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messages_json" JSONB NOT NULL DEFAULT '[]',
    "page_path" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "support_chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_chat_conversations_user_id_idx" ON "support_chat_conversations"("user_id");
