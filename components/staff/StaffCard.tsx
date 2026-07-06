"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ExternalLink, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

type Staff = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  accentColor: string;
  isActive: boolean;
};

export function StaffCard({
  member,
  tenantSlug,
  appointmentCount,
}: {
  member: Staff;
  tenantSlug: string;
  appointmentCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`¿Eliminár a ${member.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  const initial = member.name.split(" ").find(p => !["Lic.", "Dr.", "Dra.", "Mg.", "Prof."].includes(p))?.charAt(0) ?? member.name.charAt(0);

  return (
    <div
      className="overflow-hidden rounded-2xl transition-all hover:shadow-md"
      style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)", opacity: member.isActive ? 1 : 0.6 }}
    >
      {/* Color top bar */}
      <div className="h-1" style={{ backgroundColor: member.accentColor }} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${member.accentColor}, ${member.accentColor}bb)` }}
          >
            {initial.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ color: "var(--text)" }}>
              {member.title ? `${member.title} ` : ""}{member.name}
            </p>
            {member.bio && (
              <p className="mt-0.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>{member.bio}</p>
            )}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-faint)" }}>
                <Calendar className="h-3 w-3" />
                {appointmentCount} turno{appointmentCount !== 1 ? "s" : ""}
              </span>
              {!member.isActive && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                  Inactivo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/book/${tenantSlug}/team/${member.slug}`}
            target="_blank"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}
          >
            <ExternalLink className="h-3 w-3" />
            Ver página
          </Link>

          <Link
            href={`/dashboard/staff/${member.id}`}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}
          >
            Configurar
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={toggleActive}
              disabled={loading}
              className="transition-opacity hover:opacity-70"
              title={member.isActive ? "Desactivar" : "Activar"}
            >
              {member.isActive
                ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                : <ToggleLeft className="h-5 w-5" style={{ color: "var(--text-faint)" }} />
              }
            </button>
            <button
              onClick={remove}
              disabled={loading}
              className="rounded-lg p-1.5 transition-colors hover:bg-red-50 hover:text-red-500"
              style={{ color: "var(--text-faint)" }}
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
