-- Study cohort v2 (idempotent)

DO $$ BEGIN
  CREATE TYPE "StudyTimepoint" AS ENUM ('D0', 'D7', 'D14');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QuestionnaireInstrument" AS ENUM ('DASS21_STRESS', 'DASS21_FULL', 'GAD7', 'CBI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'b2b';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "study_starts_at" DATE;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "study_ends_at" DATE;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "protocol_version" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "target_n" INTEGER;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "code_pool_size" INTEGER;

ALTER TABLE "access_codes" ALTER COLUMN "department" DROP NOT NULL;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "age_band" TEXT;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "tenure_band" TEXT;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "slot_label" TEXT;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "study_day0" DATE;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "profile_enc" BYTEA;
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "last_seen_at" TIMESTAMPTZ(6);

ALTER TABLE "sessions" ALTER COLUMN "department" DROP NOT NULL;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "age_band" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "tenure_band" TEXT;

CREATE TABLE IF NOT EXISTS "daily_checkins" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "date_local" DATE NOT NULL,
    "tz" TEXT NOT NULL,
    "taken_at" TIMESTAMPTZ(6) NOT NULL,
    "client_record_id" TEXT NOT NULL,
    "payload_enc" BYTEA NOT NULL,
    "payload_sha256" TEXT NOT NULL,
    "app_version" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_checkins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "questionnaire_submissions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "instrument" "QuestionnaireInstrument" NOT NULL,
    "timepoint" "StudyTimepoint" NOT NULL,
    "taken_at" TIMESTAMPTZ(6) NOT NULL,
    "client_record_id" TEXT NOT NULL,
    "responses_enc" BYTEA NOT NULL,
    "responses_sha256" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "app_version" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "timezone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ingest_audit_logs" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT,
    "route" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "client_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ingest_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_checkins_code_hash_date_local_key" ON "daily_checkins"("code_hash", "date_local");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_checkins_code_hash_client_record_id_key" ON "daily_checkins"("code_hash", "client_record_id");
CREATE INDEX IF NOT EXISTS "daily_checkins_org_id_date_local_idx" ON "daily_checkins"("org_id", "date_local");
CREATE UNIQUE INDEX IF NOT EXISTS "questionnaire_submissions_code_hash_instrument_timepoint_key" ON "questionnaire_submissions"("code_hash", "instrument", "timepoint");
CREATE UNIQUE INDEX IF NOT EXISTS "questionnaire_submissions_code_hash_client_record_id_key" ON "questionnaire_submissions"("code_hash", "client_record_id");
CREATE INDEX IF NOT EXISTS "questionnaire_submissions_org_id_timepoint_idx" ON "questionnaire_submissions"("org_id", "timepoint");
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_code_hash_endpoint_key" ON "push_subscriptions"("code_hash", "endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_org_id_idx" ON "push_subscriptions"("org_id");
CREATE INDEX IF NOT EXISTS "ingest_audit_logs_org_id_created_at_idx" ON "ingest_audit_logs"("org_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_code_hash_fkey" FOREIGN KEY ("code_hash") REFERENCES "access_codes"("code_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "questionnaire_submissions" ADD CONSTRAINT "questionnaire_submissions_code_hash_fkey" FOREIGN KEY ("code_hash") REFERENCES "access_codes"("code_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_code_hash_fkey" FOREIGN KEY ("code_hash") REFERENCES "access_codes"("code_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ingest_audit_logs" ADD CONSTRAINT "ingest_audit_logs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
