import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertSafePushEndpoint } from "@/lib/push/endpoint";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().min(1).max(2_048),
  keys: z.object({
    p256dh: z.string().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/),
    auth: z.string().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/),
  }).strict(),
}).strict();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = subscriptionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;
  try {
    await assertSafePushEndpoint(endpoint);
  } catch {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      tenantId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth:   keys.auth,
    },
    update: {
      p256dh: keys.p256dh,
      auth:   keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}
