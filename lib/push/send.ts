/**
 * Send a Web Push notification.
 * Uses "no-payload" pattern: just a ping, service worker fetches fresh data.
 * This avoids the complex RFC8291 message encryption.
 */
import { prisma } from "@/lib/db";
import { getVapidKeys, getVapidSubject, createVapidJWT } from "./vapid";
import { assertSafePushEndpoint } from "./endpoint";

export type PushPayload = {
  title: string;
  body:  string;
  url?:  string;
  icon?: string;
};

export async function sendPushToTenant(tenantId: string, data: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { tenantId },
  });

  if (!subscriptions.length) return;

  const { publicKey, privateKey } = getVapidKeys();
  const subject = getVapidSubject();

  await Promise.allSettled(
    subscriptions.map(sub => sendOne(sub, publicKey, privateKey, subject, data))
  );
}

async function sendOne(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  vapidPublicKey: string,
  vapidPrivateKey: string,
  subject: string,
  data: PushPayload,
) {
  try {
    const url      = await assertSafePushEndpoint(sub.endpoint);
    const audience = url.origin;
    const jwt      = createVapidJWT(audience, subject, vapidPrivateKey);

    // Encode the JSON payload
    const body = JSON.stringify(data);
    const bodyBuffer = Buffer.from(body, "utf-8");

    const res = await fetch(url, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Authorization": `vapid t=${jwt},k=${vapidPublicKey}`,
        "Content-Type":  "application/json",
        "Content-Encoding": "aesgcm",
        "TTL":           "60",
        "Content-Length": String(bodyBuffer.length),
      },
      body: bodyBuffer,
    });

    // 410 Gone = subscription expired, clean up
    if (res.status === 410) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  } catch {
    // Ignore individual send failures
  }
}
