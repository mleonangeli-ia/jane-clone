import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRescheduleRejection } from "@/lib/appointment-workflow";

describe("appointment reschedule workflow", () => {
  for (const appointmentStatus of ["CONFIRMED", "PENDING"]) {
    it(`allows a paid service in ${appointmentStatus} state after payment`, () => {
      assert.equal(
        getRescheduleRejection({ servicePrice: 6000, appointmentStatus, paymentStatus: "PAID" }),
        null,
      );
    });

    it(`blocks a paid service in ${appointmentStatus} state before payment`, () => {
      assert.equal(
        getRescheduleRejection({ servicePrice: 6000, appointmentStatus, paymentStatus: "PENDING" }),
        "Completá el pago antes de reagendar este turno",
      );
    });
  }

  it("allows a free appointment without a payment", () => {
    assert.equal(
      getRescheduleRejection({
        servicePrice: 0,
        appointmentStatus: "CONFIRMED",
        paymentStatus: "PENDING",
      }),
      null,
    );
  });

  for (const appointmentStatus of ["CANCELLED", "COMPLETED", "NO_SHOW"]) {
    it(`blocks appointments in ${appointmentStatus} state`, () => {
      assert.equal(
        getRescheduleRejection({ servicePrice: 0, appointmentStatus, paymentStatus: "PAID" }),
        "Este turno no se puede reagendar",
      );
    });
  }

  it("prioritizes an unpaid-service rejection over the appointment state", () => {
    assert.equal(
      getRescheduleRejection({
        servicePrice: 6000,
        appointmentStatus: "CANCELLED",
        paymentStatus: "PENDING",
      }),
      "Completá el pago antes de reagendar este turno",
    );
  });
});
