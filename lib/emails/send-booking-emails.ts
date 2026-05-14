import { resend, FROM_EMAIL } from "@/lib/resend";
import { clientConfirmationEmail } from "./client-confirmation";
import { professionalNotificationEmail } from "./professional-notification";

type BookingEmailParams = {
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  tenantName: string;
  tenantEmail: string;
  tenantAddress: string | null;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  price: number;
  currency: string;
  notes: string | null;
  tenantSlug: string;
  appUrl: string;
};

export async function sendBookingEmails(p: BookingEmailParams) {
  const bookingUrl = `${p.appUrl}/book/${p.tenantSlug}`;
  const dashboardUrl = `${p.appUrl}/dashboard/appointments`;

  const client = clientConfirmationEmail({
    clientName: p.clientName,
    tenantName: p.tenantName,
    tenantAddress: p.tenantAddress,
    serviceName: p.serviceName,
    startTime: p.startTime,
    endTime: p.endTime,
    price: p.price,
    currency: p.currency,
    bookingUrl,
  });

  const professional = professionalNotificationEmail({
    tenantName: p.tenantName,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
    clientPhone: p.clientPhone,
    serviceName: p.serviceName,
    startTime: p.startTime,
    endTime: p.endTime,
    notes: p.notes,
    dashboardUrl,
  });

  await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: p.clientEmail,
      subject: client.subject,
      html: client.html,
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: p.tenantEmail,
      subject: professional.subject,
      html: professional.html,
    }),
  ]);
}
