"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Settings,
} from "lucide-react";

const tabs = [
  { href: "/dashboard",              label: "Inicio",   icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Agenda",   icon: Calendar        },
  { href: "/dashboard/clients",      label: "Clientes", icon: Users           },
  { href: "/dashboard/settings",     label: "Config.",  icon: Settings        },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav flex items-stretch border-t lg:hidden"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-all active:scale-95"
            style={{ color: active ? "#0f766e" : "var(--text-faint)" }}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: active ? "#0f766e" : "var(--text-faint)" }}
            >
              {label}
            </span>
            {active && (
              <span
                className="absolute top-0 h-0.5 w-10 rounded-full"
                style={{ backgroundColor: "#0f766e" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
