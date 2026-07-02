"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Users, Briefcase, Clock, Settings,
  LogOut, LayoutDashboard, ExternalLink,
  BarChart2, ClipboardList, BellPlus, Menu, X,
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
      { href: "/dashboard/services",     label: "Servicios",      icon: Briefcase     },
      { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock         },
      { href: "/dashboard/intake-forms", label: "Intake Forms",   icon: ClipboardList },
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

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = session?.user?.slug;

  return (
    <div className="flex h-full flex-col">
      {/* Logo + close button */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400 shadow-md shadow-sky-200/60">
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <span className="flex-1 text-[15px] font-bold tracking-tight text-gray-800">JaneClone</span>
        {onClose && (
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-300">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={onClose}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        active
                          ? "bg-sky-50 text-sky-700"
                          : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sky-500" : "text-gray-300")} />
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
          <Link href={`/book/${slug}`} target="_blank" onClick={onClose}>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 transition-all hover:bg-emerald-100">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="flex-1 truncate text-xs font-medium text-emerald-700">/book/{slug}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-emerald-400" />
            </div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-xs font-bold text-white shadow-sm">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-gray-700">{session?.user?.name}</p>
            <p className="truncate text-[11px] text-gray-400">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-gray-50 hover:text-gray-600"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
        <NavContent />
      </aside>

      {/* Mobile: hamburger button (shown in mobile header) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile: backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
