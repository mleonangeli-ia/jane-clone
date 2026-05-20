import { describe, it, expect, beforeAll } from "vitest";
import { clientConfirmationEmail } from "@/lib/emails/client-confirmation";
import { waitlistNotificationEmail } from "@/lib/emails/waitlist-notification";
import { reminderEmail } from "@/lib/emails/reminder";

const BASE_PARAMS = {
  clientName: "Ana García",
  tenantName: "Dra. López",
  tenantAddress: "Av. Corrientes 1234",
  serviceName: "Consulta psicológica",
  startTime: new Date("2026-06-10T14:00:00.000Z"),
  endTime: new Date("2026-06-10T15:00:00.000Z"),
  price: 500000,
  currency: "ARS",
  bookingUrl: "https://example.com/book/dra-lopez",
};

describe("clientConfirmationEmail", () => {
  it("includes the client name in the HTML", () => {
    const { html } = clientConfirmationEmail({ ...BASE_PARAMS, cancelUrl: null, intakeUrl: null });
    expect(html).toContain("Ana García");
  });

  it("includes the service name in the subject", () => {
    const { subject } = clientConfirmationEmail({ ...BASE_PARAMS, cancelUrl: null, intakeUrl: null });
    expect(subject).toContain("Consulta psicológica");
    expect(subject).toContain("Dra. López");
  });

  it("shows the cancel button when cancelUrl is provided", () => {
    const { html } = clientConfirmationEmail({
      ...BASE_PARAMS,
      cancelUrl: "https://example.com/book/dra-lopez/self-cancel?id=abc&token=xyz",
      intakeUrl: null,
    });
    expect(html).toContain("Cancelar turno");
    expect(html).toContain("self-cancel");
  });

  it("does not show the cancel button when cancelUrl is null", () => {
    const { html } = clientConfirmationEmail({ ...BASE_PARAMS, cancelUrl: null, intakeUrl: null });
    expect(html).not.toContain("Cancelar turno");
  });

  it("shows the intake form button when intakeUrl is provided", () => {
    const { html } = clientConfirmationEmail({
      ...BASE_PARAMS,
      cancelUrl: null,
      intakeUrl: "https://example.com/intake/resp-123?token=abc",
    });
    expect(html).toContain("Completar formulario");
    expect(html).toContain("/intake/");
  });

  it("omits the address row when tenantAddress is null", () => {
    const { html } = clientConfirmationEmail({ ...BASE_PARAMS, tenantAddress: null, cancelUrl: null, intakeUrl: null });
    expect(html).not.toContain("Lugar");
  });

  it("shows 'Gratis' when price is 0", () => {
    const { html } = clientConfirmationEmail({ ...BASE_PARAMS, price: 0, cancelUrl: null, intakeUrl: null });
    expect(html).toContain("Gratis");
  });
});

describe("reminderEmail", () => {
  it("has the correct subject", () => {
    const { subject } = reminderEmail({ ...BASE_PARAMS });
    expect(subject).toContain("Recordatorio");
    expect(subject).toContain("Consulta psicológica");
  });

  it("includes the client name", () => {
    const { html } = reminderEmail({ ...BASE_PARAMS });
    expect(html).toContain("Ana García");
  });

  it("produces valid HTML structure", () => {
    const { html } = reminderEmail({ ...BASE_PARAMS });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});

describe("waitlistNotificationEmail", () => {
  it("includes service name and booking URL", () => {
    const { html, subject } = waitlistNotificationEmail({
      name: "Carlos",
      tenantName: "Dra. López",
      serviceName: "Consulta",
      date: "martes 10 de junio",
      bookingUrl: "https://example.com/book/dra-lopez/serv-1",
    });
    expect(html).toContain("Carlos");
    expect(html).toContain("Consulta");
    expect(html).toContain("Reservar ahora");
    expect(subject).toContain("Se liberó un turno");
  });
});
