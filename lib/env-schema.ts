import { z } from "zod";

const optionalString = (minimum = 1) =>
  z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(minimum).optional(),
  );

const environmentSchema = z.object({
  NODE_ENV:             z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL:         z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET:      z.string().min(32, "NEXTAUTH_SECRET must be at least 32 chars"),
  NEXTAUTH_URL:         z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXT_PUBLIC_APP_URL:  z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  CAPTCHA_SECRET:       z.string().min(32, "CAPTCHA_SECRET must be at least 32 chars"),
  PAYMENTS_ENABLED:     z.enum(["true", "false"]).default("true"),
  RESEND_API_KEY:       optionalString(1),
  FROM_EMAIL:           optionalString(3),
  MP_ACCESS_TOKEN:      optionalString(1),
  MP_WEBHOOK_SECRET:    optionalString(32),
  GOOGLE_CLIENT_ID:     optionalString(1),
  GOOGLE_CLIENT_SECRET: optionalString(1),
  CRON_SECRET:          optionalString(32),
  VAPID_PUBLIC_KEY:     optionalString(1),
  VAPID_PRIVATE_KEY:    optionalString(1),
  VAPID_SUBJECT:        optionalString(1),
  AFIP_ENCRYPTION_KEY:  optionalString(32),
}).superRefine((values, context) => {
  const requireValue = (name: keyof typeof values, message: string) => {
    if (!values[name]) {
      context.addIssue({ code: "custom", path: [name], message });
    }
  };

  if (Boolean(values.GOOGLE_CLIENT_ID) !== Boolean(values.GOOGLE_CLIENT_SECRET)) {
    context.addIssue({
      code: "custom",
      path: [values.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID"],
      message: "Google OAuth client ID and secret must be configured together",
    });
  }

  const vapidValues = [values.VAPID_PUBLIC_KEY, values.VAPID_PRIVATE_KEY, values.VAPID_SUBJECT];
  const configuredVapidValues = vapidValues.filter(Boolean).length;
  if (configuredVapidValues > 0 && configuredVapidValues < vapidValues.length) {
    context.addIssue({
      code: "custom",
      path: ["VAPID_PUBLIC_KEY"],
      message: "VAPID public key, private key and subject must be configured together",
    });
  }

  if (values.NODE_ENV !== "production") return;

  requireValue("RESEND_API_KEY", "RESEND_API_KEY is required in production");
  requireValue("FROM_EMAIL", "FROM_EMAIL is required in production");
  requireValue("CRON_SECRET", "CRON_SECRET is required in production");
  requireValue("VAPID_PUBLIC_KEY", "VAPID_PUBLIC_KEY is required in production");
  requireValue("VAPID_PRIVATE_KEY", "VAPID_PRIVATE_KEY is required in production");
  requireValue("VAPID_SUBJECT", "VAPID_SUBJECT is required in production");

  if (values.PAYMENTS_ENABLED !== "false") {
    requireValue("MP_ACCESS_TOKEN", "MP_ACCESS_TOKEN is required when payments are enabled");
    requireValue("MP_WEBHOOK_SECRET", "MP_WEBHOOK_SECRET is required when payments are enabled");
  }

  for (const name of ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    if (values[name] && new URL(values[name]).protocol !== "https:") {
      context.addIssue({
        code: "custom",
        path: [name],
        message: `${name} must use HTTPS in production`,
      });
    }
  }
});

export function validateEnvironment(source: NodeJS.ProcessEnv) {
  return environmentSchema.safeParse(source);
}
