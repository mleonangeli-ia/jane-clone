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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Agenda", icon: Calendar },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/services", label: "Servicios", icon: Briefcase },
  { href: "/dashboard/availability", label: "Disponibilidad", icon: Clock },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const slug = session?.user?.slug;

  return (
    <aside className="flex h-screen w-64 flex-col bg-gray-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
          <Calendar className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-semibold text-white">JaneClone</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Booking link */}
      {slug && (
        <div className="mx-3 mb-2 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="mb-1.5 text-xs font-medium text-gray-500">Tu link de reservas</p>
          <Link
            href={`/book/${slug}`}
            target="_blank"
            className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span className="truncate">/book/{slug}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </Link>
        </div>
      )}

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="truncate text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all hover:bg-white/5 hover:text-gray-300"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
