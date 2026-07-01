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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",              label: "Inicio",         icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Agenda",         icon: Calendar        },
      { href: "/dashboard/clients",      label: "Clientes",       icon: Users           },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/dashboard/services",      label: "Servicios",      icon: Briefcase    },
      { href: "/dashboard/availability",  label: "Disponibilidad", icon: Clock        },
      { href: "/dashboard/intake-forms",  label: "Intake Forms",   icon: ClipboardList},
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/dashboard/waitlist", label: "Lista de espera", icon: BellPlus },
      { href: "/dashboard/reports",  label: "Reportes",        icon: BarChart2 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = session?.user?.slug;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-indigo-100/60 bg-indigo-25"
      style={{ backgroundColor: "#f8f7ff" }}>

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-indigo-100/50 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-md shadow-indigo-200/60">
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-indigo-900">JaneClone</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-indigo-100 text-indigo-800 shadow-sm"
                          : "text-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-indigo-600" : "text-indigo-300"
                        )}
                      />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Booking link */}
      {slug && (
        <div className="mx-3 mb-3">
          <Link href={`/book/${slug}`} target="_blank">
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 transition-all hover:bg-violet-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="flex-1 truncate text-xs font-medium text-violet-600">
                /book/{slug}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-violet-400" />
            </div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="border-t border-indigo-100/50 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white shadow-sm">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-indigo-900">
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px] text-indigo-400">
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-indigo-300 transition-all hover:bg-indigo-50 hover:text-indigo-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
