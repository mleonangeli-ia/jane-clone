"use client";

import { LOCALES, type Locale } from "@/lib/i18n";

function setLocaleCookie(locale: Locale) {
  document.cookie = `jane-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ current }: { current: Locale }) {
  function setLocale(locale: Locale) {
    setLocaleCookie(locale);
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
      {LOCALES.map(({ code, flag }) => (
        <button
          type="button"
          key={code}
          onClick={() => setLocale(code)}
          title={LOCALES.find((l) => l.code === code)?.label}
          className={`rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-all ${
            current === code
              ? "bg-white text-gray-800 shadow-sm"
              : "text-white/70 hover:bg-white/15 hover:text-white"
          }`}
        >
          {flag} {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
