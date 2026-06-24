import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { consume, peek, reset } from "./rate-limit";
import { verifyCaptchaToken } from "./captcha";

// Soft limit → CAPTCHA required after this many attempts
const SOFT  = { max: 3,  windowMs: 15 * 60_000 };
// Hard limit → full block regardless of CAPTCHA
const HARD  = { max: 10, windowMs: 15 * 60_000 };

function getIp(req: unknown): string {
  const headers = (req as { headers?: Record<string, string> }).headers ?? {};
  const forwarded = headers["x-forwarded-for"] ?? "";
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:        { label: "Email",         type: "email"    },
        password:     { label: "Password",      type: "password" },
        captchaToken: { label: "Captcha Token", type: "text"     },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email        = credentials.email.toLowerCase().trim();
        const captchaToken = credentials.captchaToken ?? "";
        const ip           = getIp(req);

        const hardKey = `login:hard:${ip}`;
        const softKey = `login:soft:${ip}`;

        // ── 1. Hard limit: consumes on every attempt ──────────────
        const hard = consume(hardKey, HARD.max, HARD.windowMs);
        if (!hard.allowed) {
          const min = Math.ceil(hard.resetInMs / 60_000);
          throw new Error(`RateLimit:${min}`);
        }

        // ── 2. Soft limit: peek first (don't charge twice) ────────
        const soft = peek(softKey, SOFT.max, SOFT.windowMs);
        if (!soft.allowed) {
          if (!captchaToken) {
            throw new Error("NeedsCaptcha");
          }

          const valid = await verifyCaptchaToken(captchaToken, ip);
          if (!valid) {
            throw new Error("InvalidCaptcha");
          }

          // CAPTCHA passed → reset soft counter so user gets 3 more free attempts
          reset(softKey);
        }

        // Consume soft slot
        consume(softKey, SOFT.max, SOFT.windowMs);

        // ── 3. Credential check ───────────────────────────────────
        const tenant = await prisma.tenant.findUnique({ where: { email } });
        if (!tenant) return null;

        const valid = await compare(credentials.password, tenant.passwordHash);
        if (!valid) return null;

        // Success → clear all counters
        reset(hardKey);
        reset(softKey);

        return {
          id:    tenant.id,
          email: tenant.email,
          name:  tenant.name,
          slug:  tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.slug = (user as unknown as { slug: string }).slug;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id   = token.id as string;
        session.user.slug = token.slug as string;
      }
      return session;
    },
  },
};
