"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreVertical, CheckCircle, XCircle, DollarSign, UserX } from "lucide-react";

type Props = {
  appointmentId: string;
  currentStatus: string;
  currentPaymentStatus: string;
};

export function AppointmentActions({ appointmentId, currentStatus, currentPaymentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(data: Record<string, string>) {
    setLoading(true);
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    router.refresh();
  }

  const isCancelled = currentStatus === "CANCELLED";
  const isPaid = currentPaymentStatus === "PAID";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-50 min-w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {!isCancelled && (
            <>
              {currentStatus !== "CONFIRMED" && (
                <MenuItem icon={CheckCircle} label="Confirmar" onClick={() => update({ status: "CONFIRMED" })} />
              )}
              {currentStatus !== "COMPLETED" && (
                <MenuItem icon={CheckCircle} label="Completar" onClick={() => update({ status: "COMPLETED" })} />
              )}
              <MenuItem icon={UserX} label="No asistió" onClick={() => update({ status: "NO_SHOW" })} />
              {!isPaid && (
                <MenuItem
                  icon={DollarSign}
                  label="Marcar como pagado"
                  onClick={() => update({ paymentStatus: "PAID" })}
                />
              )}
              <div className="my-1 h-px bg-gray-100" />
              <MenuItem
                icon={XCircle}
                label="Cancelar turno"
                onClick={() => update({ status: "CANCELLED" })}
                destructive
              />
            </>
          )}
          {isCancelled && (
            <MenuItem icon={CheckCircle} label="Reactivar" onClick={() => update({ status: "PENDING" })} />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 ${
        destructive ? "text-red-600 hover:bg-red-50" : "text-gray-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </DropdownMenu.Item>
  );
}
