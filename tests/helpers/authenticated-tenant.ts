import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

type AuthenticatedTenantFixture = {
  cookie: string;
  cleanup: () => Promise<void>;
};

function responseCookies(response: Response): string[] {
  return response.headers.getSetCookie().map((cookie) => cookie.split(";", 1)[0]);
}

export async function createAuthenticatedTenantFixture(
  baseUrl: string,
): Promise<AuthenticatedTenantFixture> {
  const { prisma } = await import("@/lib/db");
  const unique = randomBytes(16).toString("hex");
  const email = `test-${unique}@janeclone.invalid`;
  const password = randomBytes(24).toString("base64url");
  const tenant = await prisma.tenant.create({
    data: {
      name: "Integration Test Tenant",
      slug: `integration-test-${unique}`,
      email,
      passwordHash: await hash(password, 10),
    },
    select: { id: true },
  });

  try {
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    if (!csrfResponse.ok) throw new Error(`CSRF request failed with ${csrfResponse.status}`);
    const csrfPayload = await csrfResponse.json() as { csrfToken?: unknown };
    if (typeof csrfPayload.csrfToken !== "string") throw new Error("CSRF token missing");

    const csrfCookies = responseCookies(csrfResponse);
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookies.join("; "),
      },
      body: new URLSearchParams({
        csrfToken: csrfPayload.csrfToken,
        email,
        password,
        json: "true",
      }),
      redirect: "manual",
    });
    const sessionCookies = responseCookies(loginResponse).filter((cookie) =>
      cookie.startsWith("next-auth.session-token=") ||
      cookie.startsWith("__Secure-next-auth.session-token="),
    );
    if (sessionCookies.length === 0) {
      throw new Error(`Authenticated session cookie missing after status ${loginResponse.status}`);
    }

    return {
      cookie: [...csrfCookies, ...sessionCookies].join("; "),
      cleanup: async () => {
        await prisma.tenant.deleteMany({ where: { id: tenant.id } });
      },
    };
  } catch (error) {
    await prisma.tenant.deleteMany({ where: { id: tenant.id } });
    throw error;
  }
}
