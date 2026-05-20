import { describe, it, expect, vi, beforeEach } from "vitest";

// Unit-test the state transitions that the webhook produces.
// We mock prisma and the MP client to avoid any DB/network calls.

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    appointment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mercadopago", () => ({
  getPayment: vi.fn(),
}));

vi.mock("@/lib/emails/send-booking-emails", () => ({
  sendBookingEmails: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/google-calendar", () => ({
  createCalendarEvent: vi.fn().mockResolvedValue("gc-event-id"),
}));

import { prisma } from "@/lib/db";
import { getPayment } from "@/lib/mercadopago";

const mockAppointment = {
  id: "appt-1",
  status: "PENDING",
  createdAt: new Date("2026-05-01T00:00:00Z"),
  notes: null,
  startTime: new Date("2026-06-10T14:00:00Z"),
  endTime: new Date("2026-06-10T15:00:00Z"),
  client: { name: "Ana", email: "ana@test.com", phone: null },
  service: { name: "Consulta", price: 500000, intakeFormId: null },
  tenant: { name: "Dr. Pérez", email: "doc@test.com", address: null, currency: "ARS", slug: "dr-perez", timezone: "America/Argentina/Buenos_Aires", googleRefreshToken: null },
};

describe("payment webhook state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockResolvedValue([]);
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue({ ...mockAppointment, status: "CANCELLED" } as any);
  });

  it("confirms appointment and creates payment on approved status", async () => {
    vi.mocked(getPayment).mockResolvedValue({
      status: "approved",
      external_reference: "appt-1",
      transaction_amount: 5000,
      currency_id: "ARS",
    } as any);

    // Import the handler dynamically to pick up mocks
    const { POST } = await import("@/app/api/payments/webhook/route");
    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "payment", data: { id: "mp-pay-1" } }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const txCalls = vi.mocked(prisma.$transaction).mock.calls[0][0];
    // Transaction should contain update to CONFIRMED + payment upsert
    expect(txCalls).toHaveLength(2);
  });

  it("cancels appointment on rejected status", async () => {
    vi.mocked(getPayment).mockResolvedValue({
      status: "rejected",
      external_reference: "appt-1",
    } as any);

    const { POST } = await import("@/app/api/payments/webhook/route");
    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "payment", data: { id: "mp-pay-2" } }),
    });

    await POST(req as any);
    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "CANCELLED" } })
    );
  });

  it("ignores unknown event types", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");
    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: JSON.stringify({ type: "merchant_order", data: { id: "mo-1" } }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("handles missing body gracefully", async () => {
    const { POST } = await import("@/app/api/payments/webhook/route");
    const req = new Request("http://localhost/api/payments/webhook", {
      method: "POST",
      body: "not json",
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(getPayment).not.toHaveBeenCalled();
  });
});
