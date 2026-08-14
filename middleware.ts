import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Known bad User-Agent substrings (scanners, exploit kits, scrapers)
const BAD_UA_PATTERNS = [
  "sqlmap", "nikto", "nessus", "masscan", "zgrab", "gobuster",
  "dirbuster", "wfuzz", "hydra", "acunetix", "nmap",
  "python-requests", "go-http-client", "curl/",
];

// Paths that should never be accessed directly
const BLOCKED_PATH_PATTERNS = [/\.\.(\/|\\)/, /\/etc\/passwd/, /\/proc\/self/];

// API routes that are publicly accessible (no auth required)
const PUBLIC_API_PATHS = [
  "/api/auth",
  "/api/register",
  "/api/appointments",   // public booking
  "/api/slots",
  "/api/book",
  "/api/waitlist",
  "/api/intake",
  "/api/payments/webhook",
  "/api/patient",
  "/api/push/vapid-key",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent")?.toLowerCase() ?? "";

  // ── Auth guard for /dashboard and protected /api routes ───────
  const isDashboard = pathname.startsWith("/dashboard");
  const isProtectedApi = pathname.startsWith("/api/") &&
    !PUBLIC_API_PATHS.some((p) => pathname.startsWith(p));

  if (isDashboard || isProtectedApi) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      // Only set callbackUrl for same-origin paths (prevent open redirect)
      if (pathname.startsWith("/") && !pathname.startsWith("//")) {
        loginUrl.searchParams.set("callbackUrl", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Block path traversal & sensitive probes ───────────────────
  if (BLOCKED_PATH_PATTERNS.some((p) => p.test(pathname))) {
    return new NextResponse(null, { status: 400 });
  }

  // ── Block known malicious User-Agents ─────────────────────────
  // Allow empty UA from server-side calls (webhooks, etc.)
  if (ua && BAD_UA_PATTERNS.some((p) => ua.includes(p))) {
    return new NextResponse(null, { status: 403 });
  }

  const res = NextResponse.next();

  // ── Security headers ──────────────────────────────────────────
  // Prevent embedding in iframes (clickjacking)
  res.headers.set("X-Frame-Options", "DENY");
  // Block MIME sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer info
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  // Basic CSP — allows Cloudflare Turnstile + same-origin scripts
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://challenges.cloudflare.com",
      "font-src 'self'",
    ].join("; ")
  );
  // Opt out of FLoC / Topics API
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
