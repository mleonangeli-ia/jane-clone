"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  services: { id: string; name: string }[];
  staffList: { id: string; name: string; title: string | null; accentColor: string }[];
  defaultValues: { q?: string; status?: string; serviceId?: string; staffId?: string };
};

const STATUS_OPTIONS = [
  { value: "",          label: "Todos los estados" },
  { value: "PENDING",   label: "Pendiente"         },
  { value: "CONFIRMED", label: "Confirmado"         },
  { value: "CANCELLED", label: "Cancelado"          },
  { value: "COMPLETED", label: "Completado"         },
  { value: "NO_SHOW",   label: "No asistió"         },
];

const SELECT_CLASS = "rounded-xl border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring h-10"

export function AppointmentsFilters({ services, staffList, defaultValues }: Props) {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(defaultValues.q ?? "");

  function updateParam(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else      params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const t = setTimeout(() => updateParam("q", q), 400);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Search */}
      <Input
        type="search"
        placeholder="Buscar cliente..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="h-10 w-44 rounded-xl"
      />

      {/* Status */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={e => updateParam("status", e.target.value)}
        className={SELECT_CLASS}
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text)" }}
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Service */}
      <select
        value={searchParams.get("serviceId") ?? ""}
        onChange={e => updateParam("serviceId", e.target.value)}
        className={SELECT_CLASS}
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text)" }}
      >
        <option value="">Todos los servicios</option>
        {services.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* Staff — solo aparece si la clínica tiene profesionales */}
      {staffList.length > 0 && (
        <select
          value={searchParams.get("staffId") ?? ""}
          onChange={e => updateParam("staffId", e.target.value)}
          className={SELECT_CLASS}
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)", color: "var(--text)" }}
        >
          <option value="">Todos los profesionales</option>
          {staffList.map(m => (
            <option key={m.id} value={m.id}>
              {m.title ? `${m.title} ` : ""}{m.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
