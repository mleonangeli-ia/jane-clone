import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";
import { consume, reset } from "./rate-limit";

// 10 attempts per IP per 15 min — stops brute force from a single origin
const IP_LIMIT    = { max: 10, windowMs: 15 * 60_000 };
// 5 attempts per email per 15 min — stops distributed attacks on a single account
const EMAIL_LIMIT = { max: 5,  windowMs: 15 * 60_000 };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      // NextAuth v4 passes the raw IncomingMessage as second arg
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // ── Rate limiting ────────────────────────────────────────────
        const forwarded = (req as unknown as { headers?: Record<string, string> })
          .headers?.["x-forwarded-for"];
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

        const byIp    = consume(`login:ip:${ip}`,       IP_LIMIT.max,    IP_LIMIT.windowMs);
        const byEmail = consume(`login:email:${email}`, EMAIL_LIMIT.max, EMAIL_LIMIT.windowMs);

        if (!byIp.allowed || !byEmail.allowed) {
          const resetInMin = Math.ceil(
            Math.max(byIp.resetInMs, byEmail.resetInMs) / 60_000
          );
          throw new Error(`RateLimit:${resetInMin}`);
        }
        // ────────────────────────────────────────────────────────────

        const tenant = await prisma.tenant.findUnique({ where: { email } });
        if (!tenant) return null;

        const valid = await compare(credentials.password, tenant.passwordHash);
        if (!valid) return null;

        // Success — clear failure counters so the user isn't locked out later
        reset(`login:ip:${ip}`);
        reset(`login:email:${email}`);

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
