"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  services: { id: string; name: string }[];
  defaultValues: { q?: string; status?: string; serviceId?: string };
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "NO_SHOW", label: "No asistió" },
];

export function AppointmentsFilters({ services, defaultValues }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultValues.q ?? "");

  function updateParam(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam("q", q);
    }, 400);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        type="search"
        placeholder="Buscar cliente..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-48"
      />
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("serviceId") ?? ""}
        onChange={(e) => updateParam("serviceId", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Todos los servicios</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
