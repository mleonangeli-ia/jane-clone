import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const tenant = await prisma.tenant.findUnique({
          where: { email: credentials.email },
        });

        if (!tenant) return null;

        const valid = await compare(credentials.password, tenant.passwordHash);
        if (!valid) return null;

        return {
          id: tenant.id,
          email: tenant.email,
          name: tenant.name,
          slug: tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.slug = (user as unknown as { slug: string }).slug;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.slug = token.slug as string;
      }
      return session;
    },
  },
};
