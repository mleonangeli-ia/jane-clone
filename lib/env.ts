import { validateEnvironment } from "@/lib/env-schema";

function validateEnv() {
  const result = validateEnvironment(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`\n[env] Missing or invalid environment variables:\n${missing}\n`);
  }
  return result.data;
}

// Validate once at module load — fails fast on server startup
export const env = validateEnv();
