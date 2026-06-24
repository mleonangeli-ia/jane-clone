import { cookies } from "next/headers";
import { getT, type Locale } from "@/lib/i18n";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";

export default async function CancelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale).cancel;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="h-1.5 w-full bg-gray-200" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-4xl">😕</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-3 text-gray-500">{t.sub}</p>

          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.heading}</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              {t.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <Link href={`/book/${slug}`}>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg">
                <RefreshCcw className="h-4 w-4" />
                {t.retry}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
