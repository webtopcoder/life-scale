-- CreateEnum
CREATE TYPE "BrainTeaserFormat" AS ENUM ('riddle', 'lateral_thinking', 'visual', 'wordplay', 'logic_grid');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('logic', 'pattern', 'spatial', 'speed', 'memory', 'verbal', 'self', 'general');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('brain_teaser', 'puzzle', 'lesson');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "PuzzleFormat" AS ENUM ('multiple_choice', 'free_response', 'interactive');

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'iq',
    "condition_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'trophy',
    "name" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_applications" (
    "id" UUID NOT NULL,
    "business_name" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "traffic_source" TEXT NOT NULL,
    "website_url" TEXT,

    CONSTRAINT "affiliate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" UUID NOT NULL,
    "adaptive_ability" DECIMAL,
    "completed_at" TIMESTAMPTZ(6),
    "completion_time_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "final_score" INTEGER,
    "gender" TEXT,
    "is_v2" BOOLEAN NOT NULL DEFAULT false,
    "percentiles" JSONB,
    "scores" JSONB,
    "secondary_category" TEXT,
    "session_id" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "strongest_category" TEXT,
    "trajectory" TEXT,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_answers" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_correct" BOOLEAN,
    "question_id" INTEGER NOT NULL,
    "selected_option" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "time_spent_ms" INTEGER NOT NULL,

    CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bh_daily_logs" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "focus" INTEGER,
    "hydration" BOOLEAN,
    "log_date" DATE NOT NULL,
    "mood" INTEGER,
    "movement_minutes" INTEGER,
    "sleep_hours" DECIMAL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "bh_daily_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brain_teasers" (
    "id" UUID NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'iq',
    "category" "ContentCategory" NOT NULL DEFAULT 'general',
    "content_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "format" "BrainTeaserFormat" NOT NULL,
    "solution" TEXT,
    "title" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "brain_teasers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancel_otps" (
    "id" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "otp_code" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),

    CONSTRAINT "cancel_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_feedback" (
    "id" UUID NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'help',
    "subscription_id" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "cancellation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_conversations" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messages_json" JSONB NOT NULL DEFAULT '[]',
    "title" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "coach_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_json" JSONB NOT NULL,
    "report_type" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "final_score" INTEGER,
    "plan_json" JSONB NOT NULL,
    "scores_snapshot" JSONB NOT NULL,
    "strongest_category" TEXT,
    "user_id" TEXT NOT NULL,
    "weakest_category" TEXT,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'iq',
    "category" "ContentCategory" NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "modules_json" JSONB NOT NULL DEFAULT '[]',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "quiz_json" JSONB NOT NULL DEFAULT '[]',
    "title" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likert_test_results" (
    "id" UUID NOT NULL,
    "answers_json" JSONB NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "max_score" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "result_label" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "total_score" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "likert_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_flows" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,

    CONSTRAINT "onboarding_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_questions" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "correct_answer" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "display_ms" INTEGER,
    "flow_id" UUID NOT NULL,
    "has_reinforcement" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "options" JSONB NOT NULL DEFAULT '[]',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "sequence" JSONB,
    "sequence_variant" TEXT,
    "subskill" TEXT,
    "subtitle" TEXT,
    "target_delay_ms" JSONB,
    "target_position" INTEGER,
    "time_limit_ms" INTEGER,
    "type" TEXT NOT NULL,

    CONSTRAINT "onboarding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "avatar_url" TEXT,
    "brain_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "declined_upsells" JSONB,
    "display_name" TEXT,
    "entitled_branch" TEXT,
    "first_report_seen_bh_at" TIMESTAMPTZ(6),
    "first_report_seen_hg_at" TIMESTAMPTZ(6),
    "first_report_seen_iq_at" TIMESTAMPTZ(6),
    "has_used_trial" BOOLEAN NOT NULL DEFAULT false,
    "last_ip" TEXT,
    "last_ip_at" TIMESTAMPTZ(6),
    "last_ip_source" TEXT,
    "last_login_date" DATE,
    "level" INTEGER NOT NULL DEFAULT 1,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "subscription_tier" TEXT,
    "timezone" TEXT,
    "timezone_at" TIMESTAMPTZ(6),
    "timezone_source" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" UUID NOT NULL,
    "branches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" "ContentCategory" NOT NULL DEFAULT 'general',
    "content_json" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "format" "PuzzleFormat" NOT NULL,
    "time_limit_seconds" INTEGER,
    "title" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "billing_amount" TEXT,
    "billing_date" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "subject" TEXT NOT NULL,
    "zendesk_ticket_id" TEXT,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_completions" (
    "id" UUID NOT NULL,
    "branch" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "test_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_progress" (
    "id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "content_id" UUID NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT,
    "score" INTEGER,
    "status" "ProgressStatus" NOT NULL DEFAULT 'not_started',
    "time_spent_ms" INTEGER,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_content_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "adaptive_ability" DECIMAL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "external_id" TEXT,
    "final_score" INTEGER,
    "percentile" INTEGER,
    "session_id" TEXT NOT NULL,
    "strongest_category" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_purchases" (
    "id" UUID NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "breeze_payment_page_id" TEXT,
    "client_ip" TEXT,
    "client_ip_source" TEXT,
    "ff_payment_id" TEXT,
    "ff_subscription_id" TEXT,
    "funnel_session_id" TEXT,
    "product_key" TEXT NOT NULL,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "user_id" TEXT,

    CONSTRAINT "user_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "final_score" INTEGER,
    "percentile" INTEGER,
    "percentiles" JSONB,
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scores" JSONB,
    "session_id" TEXT NOT NULL,
    "strongest_category" TEXT,
    "test_type" TEXT NOT NULL DEFAULT 'iq',
    "title" TEXT NOT NULL DEFAULT 'IQ Report',
    "user_id" TEXT,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_sessions_session_id_key" ON "assessment_sessions"("session_id");

-- CreateIndex
CREATE INDEX "assessment_answers_session_id_idx" ON "assessment_answers"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "bh_daily_logs_user_id_log_date_key" ON "bh_daily_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "cancel_otps_email_idx" ON "cancel_otps"("email");

-- CreateIndex
CREATE INDEX "coach_conversations_user_id_idx" ON "coach_conversations"("user_id");

-- CreateIndex
CREATE INDEX "generated_reports_user_id_report_type_idx" ON "generated_reports"("user_id", "report_type");

-- CreateIndex
CREATE INDEX "learning_paths_user_id_idx" ON "learning_paths"("user_id");

-- CreateIndex
CREATE INDEX "likert_test_results_user_id_idx" ON "likert_test_results"("user_id");

-- CreateIndex
CREATE INDEX "onboarding_questions_flow_id_question_id_idx" ON "onboarding_questions"("flow_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_completions_user_id_branch_key" ON "test_completions"("user_id", "branch");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_content_progress_user_id_content_type_content_id_key" ON "user_content_progress"("user_id", "content_type", "content_id");

-- CreateIndex
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_session_id_idx" ON "user_profiles"("session_id");

-- CreateIndex
CREATE INDEX "user_purchases_user_id_idx" ON "user_purchases"("user_id");

-- CreateIndex
CREATE INDEX "user_purchases_funnel_session_id_idx" ON "user_purchases"("funnel_session_id");

-- CreateIndex
CREATE INDEX "user_purchases_breeze_payment_page_id_idx" ON "user_purchases"("breeze_payment_page_id");

-- CreateIndex
CREATE INDEX "user_reports_user_id_idx" ON "user_reports"("user_id");

-- CreateIndex
CREATE INDEX "user_reports_email_idx" ON "user_reports"("email");

-- AddForeignKey
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_questions" ADD CONSTRAINT "onboarding_questions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "assessment_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;
