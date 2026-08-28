type RescheduleState = {
  servicePrice: number;
  appointmentStatus: string;
  paymentStatus: string;
};

export function getRescheduleRejection({
  servicePrice,
  appointmentStatus,
  paymentStatus,
}: RescheduleState): string | null {
  if (servicePrice > 0 && paymentStatus !== "PAID") {
    return "Completá el pago antes de reagendar este turno";
  }
  if (!new Set(["CONFIRMED", "PENDING"]).has(appointmentStatus)) {
    return "Este turno no se puede reagendar";
  }
  return null;
}
