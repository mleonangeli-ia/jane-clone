import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { waitlistNotificationEmail } from "@/lib/emails/waitlist-notification";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export async function notifyWaitlist(tenantId: string, serviceId: string, startTime: Date, appUrl: string) {
  const date = format(startTime, "yyyy-MM-dd");

  const [entries, service, tenant] = await Promise.all([
    prisma.waitlistEntry.findMany({ where: { tenantId, serviceId, date, notifiedAt: null } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  if (!entries.length || !service || !tenant) return;

  const bookingUrl = `${appUrl}/book/${tenant.slug}/${serviceId}`;
  const dateLabel = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });

  await Promise.allSettled(
    entries.map((entry) => {
      const { subject, html } = waitlistNotificationEmail({
        name: entry.name,
        tenantName: tenant.name,
        serviceName: service.name,
        date: dateLabel,
        bookingUrl,
      });
      return resend.emails.send({ from: FROM_EMAIL, to: entry.email, subject, html });
    })
  );

  await prisma.waitlistEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: { notifiedAt: new Date() },
  });
}
