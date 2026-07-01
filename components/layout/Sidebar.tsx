"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  Briefcase,
  Clock,
  Settings,
  LogOut,
  LayoutDashboard,
  ExternalLink,
  BarChart2,
  ClipboardList,
  BellPlus,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Agenda", icon: Calendar },
      { href: "/dashboard/clients", label: "Clientes", icon: Users },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/dashboard/services", label: "Servicios", icon: Briefcase },
      { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock },
      { href: "/dashboard/intake-forms", label: "Intake Forms", icon: ClipboardList },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/dashboard/waitlist", label: "Lista de espera", icon: BellPlus },
      { href: "/dashboard/reports", label: "Reportes", icon: BarChart2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = session?.user?.slug;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/[0.06] bg-[#0f0f14]">

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-white">JaneClone</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:bg-white/[0.06] hover:text-white/80"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          active ? "text-indigo-400" : "text-white/30 group-hover:text-white/60"
                        )}
                      />
                      <span className="flex-1">{label}</span>
                      {active && (
                        <ChevronRight className="h-3 w-3 text-white/30" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Booking link pill */}
      {slug && (
        <div className="mx-3 mb-3">
          <Link href={`/book/${slug}`} target="_blank">
            <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/15">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="flex-1 truncate text-xs font-medium text-indigo-300">
                /book/{slug}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-indigo-400" />
            </div>
          </Link>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold text-white/90">
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px] text-white/30">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/30 transition-all hover:bg-white/5 hover:text-white/60"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
