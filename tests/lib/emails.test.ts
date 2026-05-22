import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clientConfirmationEmail } from "@/lib/emails/client-confirmation";
import { waitlistNotificationEmail } from "@/lib/emails/waitlist-notification";
import { reminderEmail } from "@/lib/emails/reminder";

const BASE = {
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
  it("includes the client name", () => {
    const { html } = clientConfirmationEmail({ ...BASE, cancelUrl: null, intakeUrl: null });
    assert.ok(html.includes("Ana García"));
  });

  it("includes service and tenant names in the subject", () => {
    const { subject } = clientConfirmationEmail({ ...BASE, cancelUrl: null, intakeUrl: null });
    assert.ok(subject.includes("Consulta psicológica"));
    assert.ok(subject.includes("Dra. López"));
  });

  it("renders the cancel button when cancelUrl is provided", () => {
    const { html } = clientConfirmationEmail({
      ...BASE,
      cancelUrl: "https://example.com/self-cancel?id=x&token=y",
      intakeUrl: null,
    });
    assert.ok(html.includes("Cancelar turno"));
  });

  it("does not render the cancel button when cancelUrl is null", () => {
    const { html } = clientConfirmationEmail({ ...BASE, cancelUrl: null, intakeUrl: null });
    assert.ok(!html.includes("Cancelar turno"));
  });

  it("renders the intake form CTA when intakeUrl is provided", () => {
    const { html } = clientConfirmationEmail({
      ...BASE,
      cancelUrl: null,
      intakeUrl: "https://example.com/intake/r1?token=abc",
    });
    assert.ok(html.includes("Completar formulario"));
  });

  it("omits the address row when tenantAddress is null", () => {
    const { html } = clientConfirmationEmail({ ...BASE, tenantAddress: null, cancelUrl: null, intakeUrl: null });
    assert.ok(!html.includes("Lugar"));
  });

  it("shows 'Gratis' for a zero-price service", () => {
    const { html } = clientConfirmationEmail({ ...BASE, price: 0, cancelUrl: null, intakeUrl: null });
    assert.ok(html.includes("Gratis"));
  });

  it("produces valid HTML", () => {
    const { html } = clientConfirmationEmail({ ...BASE, cancelUrl: null, intakeUrl: null });
    assert.ok(html.startsWith("<!DOCTYPE html>"));
    assert.ok(html.endsWith("</html>"));
  });
});

describe("reminderEmail", () => {
  it("includes 'Recordatorio' and the service name in the subject", () => {
    const { subject } = reminderEmail(BASE);
    assert.ok(subject.includes("Recordatorio"));
    assert.ok(subject.includes("Consulta psicológica"));
  });

  it("includes the client name in the body", () => {
    const { html } = reminderEmail(BASE);
    assert.ok(html.includes("Ana García"));
  });

  it("produces valid HTML", () => {
    const { html } = reminderEmail(BASE);
    assert.ok(html.startsWith("<!DOCTYPE html>"));
    assert.ok(html.includes("</html>"));
  });
});

describe("waitlistNotificationEmail", () => {
  it("includes the service name and booking URL", () => {
    const { html, subject } = waitlistNotificationEmail({
      name: "Carlos",
      tenantName: "Dra. López",
      serviceName: "Consulta",
      date: "martes 10 de junio",
      bookingUrl: "https://example.com/book/dra-lopez/svc-1",
    });
    assert.ok(html.includes("Carlos"));
    assert.ok(html.includes("Consulta"));
    assert.ok(html.includes("Reservar ahora"));
    assert.ok(subject.includes("Se liberó un turno"));
  });
});
