"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
      style={{
        backgroundColor: "var(--bg-hover)",
        color: "var(--text-muted)",
      }}
    >
      {dark
        ? <Sun  className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  );
}
