import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL:        z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET:     z.string().min(16, "NEXTAUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL:        z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Optional — warn if missing in production
  RESEND_API_KEY:      z.string().optional(),
  MP_ACCESS_TOKEN:     z.string().optional(),
  GOOGLE_CLIENT_ID:    z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CRON_SECRET:         z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  MP_WEBHOOK_SECRET:   z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`\n[env] Missing or invalid environment variables:\n${missing}\n`);
  }

  // Warn about optional vars that should be set in production
  if (process.env.NODE_ENV === "production") {
    const optional = ["RESEND_API_KEY", "MP_ACCESS_TOKEN", "CRON_SECRET", "MP_WEBHOOK_SECRET"];
    const unset = optional.filter((k) => !process.env[k]);
    if (unset.length > 0) {
      console.warn(`[env] Warning: optional vars not set in production: ${unset.join(", ")}`);
    }
  }

  return result.data;
}

// Validate once at module load — fails fast on server startup
export const env = validateEnv();
