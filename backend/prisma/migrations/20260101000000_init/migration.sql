-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pilot_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_until" DATE NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_codes" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "shift" TEXT,
    "activated_at" TIMESTAMPTZ(6),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "shift" TEXT,
    "taken_at" TIMESTAMPTZ(6) NOT NULL,
    "risk_index_enc" BYTEA NOT NULL,
    "pvt_index_enc" BYTEA NOT NULL,
    "stroop_index_enc" BYTEA NOT NULL,
    "cbi_score_enc" BYTEA,
    "sleep_hours_enc" BYTEA NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employer_users" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employer_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "consented_at" TIMESTAMPTZ(6) NOT NULL,
    "policy_version" TEXT NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "access_codes_code_hash_key" ON "access_codes"("code_hash");

-- CreateIndex
CREATE INDEX "access_codes_org_id_idx" ON "access_codes"("org_id");

-- CreateIndex
CREATE INDEX "sessions_org_id_idx" ON "sessions"("org_id");

-- CreateIndex
CREATE INDEX "sessions_code_hash_idx" ON "sessions"("code_hash");

-- CreateIndex
CREATE INDEX "sessions_department_idx" ON "sessions"("department");

-- CreateIndex
CREATE INDEX "sessions_taken_at_idx" ON "sessions"("taken_at");

-- CreateIndex
CREATE UNIQUE INDEX "employer_users_email_key" ON "employer_users"("email");

-- CreateIndex
CREATE INDEX "employer_users_org_id_idx" ON "employer_users"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "consents_code_hash_key" ON "consents"("code_hash");

-- CreateIndex
CREATE INDEX "consents_code_hash_idx" ON "consents"("code_hash");

-- AddForeignKey
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_code_hash_fkey" FOREIGN KEY ("code_hash") REFERENCES "access_codes"("code_hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employer_users" ADD CONSTRAINT "employer_users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_code_hash_fkey" FOREIGN KEY ("code_hash") REFERENCES "access_codes"("code_hash") ON DELETE RESTRICT ON UPDATE CASCADE;
