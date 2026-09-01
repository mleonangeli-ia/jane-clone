import { prisma } from "@/lib/db";

export interface CaptchaProofStore {
  consume(key: string, expiresAt: Date, now: Date): Promise<boolean>;
}

export const postgresCaptchaProofStore: CaptchaProofStore = {
  async consume(key, expiresAt, now) {
    const rows = await prisma.$queryRaw<Array<{ key: string }>>`
      WITH "expired" AS (
        SELECT "key"
        FROM "captcha_proof_uses"
        WHERE "expiresAt" <= ${now}
        LIMIT 100
      ),
      "cleanup" AS (
        DELETE FROM "captcha_proof_uses"
        USING "expired"
        WHERE "captcha_proof_uses"."key" = "expired"."key"
      )
      INSERT INTO "captcha_proof_uses" ("key", "expiresAt", "createdAt")
      VALUES (${key}, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO NOTHING
      RETURNING "key"
    `;

    return rows.length === 1;
  },
};
