"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Users, Briefcase, Clock, Settings,
  LogOut, LayoutDashboard, ExternalLink,
  BarChart2, ClipboardList, BellPlus, Menu, X, FileText,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

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
      { href: "/dashboard/waitlist",  label: "Lista de espera", icon: BellPlus  },
      { href: "/dashboard/reports",   label: "Reportes",        icon: BarChart2 },
      { href: "/dashboard/invoices",  label: "Comprobantes",    icon: FileText  },
    ],
  },
];

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = session?.user?.slug;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--sidebar-bg)" }}>

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400 shadow-md shadow-sky-200/40">
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <span className="flex-1 text-[15px] font-bold tracking-tight" style={{ color: "var(--text)" }}>
          JaneClone
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors lg:hidden"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest"
               style={{ color: "var(--text-faint)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} onClick={onClose}>
                    <div
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                      style={{
                        backgroundColor: active ? "var(--sidebar-active-bg)" : "transparent",
                        color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
                          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-hover)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
                        }
                      }}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: active ? "var(--sidebar-icon-active)" : "var(--text-faint)" }}
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
          <Link href={`/book/${slug}`} target="_blank" onClick={onClose}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
              style={{
                border: "1px solid var(--emerald-muted)",
                backgroundColor: "var(--emerald-muted)",
              }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="flex-1 truncate text-xs font-medium" style={{ color: "var(--emerald-text)" }}>
                /book/{slug}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0" style={{ color: "var(--emerald-text)", opacity: 0.6 }} />
            </div>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="p-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-xs font-bold text-white shadow-sm">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold" style={{ color: "var(--text)" }}>
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px]" style={{ color: "var(--text-faint)" }}>
              {session?.user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all"
          style={{ color: "var(--text-faint)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
          }}
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
      {/* Desktop */}
      <aside className="hidden h-screen w-60 shrink-0 lg:flex lg:flex-col"
             style={{ borderRight: "1px solid var(--sidebar-border)" }}>
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl shadow-sm lg:hidden"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
