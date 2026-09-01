CREATE TABLE "captcha_proof_uses" (
    "key" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captcha_proof_uses_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "captcha_proof_uses_expiresAt_idx" ON "captcha_proof_uses"("expiresAt");
