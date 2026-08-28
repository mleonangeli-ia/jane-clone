export function buildContentSecurityPolicy(environment: string | undefined): string {
  const scriptSources = environment === "development"
    ? "'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
    : "'self' 'unsafe-inline' https://challenges.cloudflare.com";

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    "frame-src https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "font-src 'self'",
  ].join("; ");
}
