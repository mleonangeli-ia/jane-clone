import Link from "next/link";
import { Calendar, Users, CreditCard, Clock, ArrowRight, CheckCircle, Zap, Shield, Globe } from "lucide-react";

const stats = [
  { value: "500+", label: "Profesionales" },
  { value: "50k+", label: "Turnos" },
  { value: "5 min", label: "Configuración" },
  { value: "0 $", label: "Para empezar" },
];

const features = [
  { icon: Calendar, title: "Agenda online 24/7",      desc: "Tus pacientes reservan sus turnos en cualquier momento, sin llamadas ni WhatsApps.", bg: "#eef2ff", icon_bg: "#c7d2fe", icon_color: "#4f46e5" },
  { icon: Users,    title: "Gestión de clientes",      desc: "Historial completo, notas y datos de contacto siempre a mano.", bg: "#e0f2fe", icon_bg: "#bae6fd", icon_color: "#0284c7" },
  { icon: CreditCard, title: "Pagos con MercadoPago", desc: "Cobrá al momento de la reserva. El dinero cae directo en tu cuenta.", bg: "#dcfce7", icon_bg: "#bbf7d0", icon_color: "#16a34a" },
  { icon: Globe,    title: "Multiidioma",              desc: "Tu página disponible en español, inglés y portugués. Para todos tus pacientes.", bg: "#fef9c3", icon_bg: "#fde68a", icon_color: "#ca8a04" },
  { icon: Shield,   title: "Seguridad incluida",       desc: "Rate limiting, CAPTCHA y headers de seguridad. Tu cuenta protegida desde el día 1.", bg: "#f3e8ff", icon_bg: "#e9d5ff", icon_color: "#7c3aed" },
  { icon: Zap,      title: "Recordatorios automáticos",desc: "Emails automáticos al confirmar el turno. Menos no-shows, más tranquilidad.", bg: "#ffe4e6", icon_bg: "#fecdd3", icon_color: "#e11d48" },
];

const testimonials = [
  { quote: "Desde que uso JaneClone mis pacientes reservan solos. Ya no pierdo tiempo coordinando.", name: "Lic. Florencia L.", role: "Psicóloga, CABA",     initial: "F", bg: "#eef2ff", color: "#4f46e5" },
  { quote: "Configuré todo en 10 minutos y al día siguiente ya tenía mis primeras reservas.",       name: "Dr. Martín S.",   role: "Kinesiólogo, Rosario", initial: "M", bg: "#e0f2fe", color: "#0284c7" },
  { quote: "El cobro con MercadoPago me cambió la vida. Cero turnos sin pagar.",                   name: "Lic. Ana R.",     role: "Nutricionista, Cba.",  initial: "A", bg: "#dcfce7", color: "#16a34a" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-sky-100/50 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-md shadow-sky-200/60">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">JaneClone</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-gray-400 hover:text-sky-600 transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="text-sm text-gray-400 hover:text-sky-600 transition-colors">Testimonios</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <button className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors sm:block">
                Iniciar sesión
              </button>
            </Link>
            <Link href="/register">
              <button className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl">
                Empezar gratis
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-24" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ecfeff 50%, #f0f9ff 100%)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-5xl bg-gradient-to-r from-transparent via-sky-200/60 to-transparent" />

          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm font-medium text-sky-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Para profesionales de la salud
            </div>

            <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl">
              Tu agenda online,{" "}
              <span className="text-sky-500">sin complicaciones</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
              Creá tu perfil profesional, compartí tu link y empezá a recibir reservas en minutos.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register">
                <button className="flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-8 text-base font-semibold text-white shadow-xl shadow-sky-200/60 transition-all hover:-translate-y-0.5 hover:bg-sky-600">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/book/florencia-lucchini">
                <button className="flex h-12 items-center gap-2 rounded-xl border border-sky-200 bg-white px-8 text-base font-medium text-sky-600 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50">
                  Ver demo en vivo
                </button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-300">Sin tarjeta de crédito · Gratis para empezar</p>

            {/* Stats */}
            <div className="mx-auto mt-14 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-sky-100 bg-white px-4 py-4 shadow-sm">
                  <p className="text-2xl font-extrabold text-sky-600">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto mt-16 max-w-5xl px-6">
            <div className="relative overflow-hidden rounded-2xl border border-sky-100 shadow-2xl shadow-sky-100/80">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 bg-gray-100 px-4 py-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <div className="mx-auto flex h-5 w-52 items-center justify-center rounded-md bg-white px-2 shadow-inner">
                  <span className="text-[10px] text-gray-400">janeclone.vercel.app/dashboard</span>
                </div>
              </div>
              {/* App UI */}
              <div className="flex" style={{ height: "380px", background: "#f9fafb" }}>
                {/* Sidebar */}
                <div className="hidden w-48 shrink-0 flex-col gap-0.5 border-r border-gray-100 bg-white p-3 sm:flex">
                  <div className="mb-4 flex items-center gap-2 px-2">
                    <div className="h-5 w-5 rounded-lg bg-sky-400" />
                    <div className="h-2.5 w-16 rounded-md bg-sky-100" />
                  </div>
                  {[["Inicio", true], ["Agenda", false], ["Clientes", false], ["Servicios", false], ["Config.", false]].map(([item, active]) => (
                    <div key={String(item)} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${active ? "bg-sky-50" : ""}`}>
                      <div className={`h-3 w-3 rounded ${active ? "bg-sky-400" : "bg-gray-200"}`} />
                      <div className={`h-2 rounded ${active ? "bg-sky-300 w-8" : "bg-gray-200 w-10"}`} />
                    </div>
                  ))}
                </div>
                {/* Dashboard content */}
                <div className="flex-1 overflow-hidden p-5">
                  {/* Stat cards */}
                  <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    {[
                      { label: "Turnos hoy", val: "4", bg: "#eef2ff", icon_bg: "#c7d2fe", color: "#4f46e5" },
                      { label: "Clientes",   val: "28", bg: "#e0f2fe", icon_bg: "#bae6fd", color: "#0284c7" },
                      { label: "Cobrado",    val: "$12k", bg: "#dcfce7", icon_bg: "#bbf7d0", color: "#16a34a" },
                      { label: "Pendientes", val: "2", bg: "#fef9c3", icon_bg: "#fde68a", color: "#ca8a04" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl p-3 shadow-sm" style={{ backgroundColor: card.bg, border: `1px solid ${card.icon_bg}` }}>
                        <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: card.color, opacity: 0.7 }}>{card.label}</p>
                        <p className="mt-1 text-lg font-extrabold" style={{ color: card.color }}>{card.val}</p>
                      </div>
                    ))}
                  </div>
                  {/* Appointment list */}
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-50 px-4 py-2.5">
                      <div className="h-2 w-20 rounded-md bg-gray-200" />
                    </div>
                    {[
                      { time: "09:00", name: "María García",    color: "#818cf8" },
                      { time: "10:30", name: "Carlos López",    color: "#38bdf8" },
                      { time: "12:00", name: "Ana Rodríguez",   color: "#4ade80" },
                    ].map((apt) => (
                      <div key={apt.time} className="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-0">
                        <span className="w-10 text-xs font-bold" style={{ color: apt.color }}>{apt.time}</span>
                        <div className="h-6 w-0.5 rounded-full" style={{ background: apt.color }} />
                        <div className="h-2 w-20 rounded-md bg-gray-200" />
                        <div className="ml-auto h-4 w-12 rounded-full bg-emerald-100" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-sky-100/50 via-violet-100/50 to-pink-100/50 blur-2xl" />
          </div>
        </section>

        {/* ── Benefits ─────────────────────────────────────── */}
        <section className="border-y border-gray-100 py-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Sin costos de instalación", "Tu link propio", "Emails automáticos", "Pagos con MercadoPago", "Multiidioma", "Seguridad incluida"].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-sky-500">Funcionalidades</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitás
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, bg, icon_bg, icon_color }) => (
              <div key={title} className="group relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ backgroundColor: bg, borderColor: icon_bg }}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: icon_bg }}>
                  <Icon className="h-5 w-5" style={{ color: icon_color }} />
                </div>
                <h3 className="mb-2 font-bold text-gray-800">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section id="testimonials" className="py-24" style={{ background: "linear-gradient(160deg, #f0fdf4, #ecfeff)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-sky-500">Testimonios</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Profesionales que ya lo usan
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: t.bg.replace("ff", "88") }}>
                  <p className="text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm" style={{ backgroundColor: t.color }}>
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl p-16 text-center shadow-xl" style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #ecfeff 50%, #e0f2fe 100%)", border: "1px solid #a7f3d0" }}>
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #6ee7b7 1px, transparent 1px), radial-gradient(circle at 75% 50%, #67e8f9 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-emerald-900 sm:text-4xl">Listo para empezar?</h2>
              <p className="mx-auto mt-4 max-w-md text-gray-500">
                Configurá tu agenda en menos de 5 minutos. Gratis para siempre en el plan básico.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <button className="flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-8 text-base font-bold text-white shadow-xl shadow-sky-200/60 transition-all hover:-translate-y-0.5 hover:bg-sky-600">
                    Crear mi cuenta gratis
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/book/florencia-lucchini">
                  <button className="flex h-12 items-center gap-2 rounded-xl border border-sky-200 bg-white px-8 text-base font-medium text-sky-600 shadow-sm transition-all hover:bg-sky-50">
                    Ver demo
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-400">
              <Calendar className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-600">JaneClone</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 JaneClone · Plataforma de turnos para profesionales de la salud</p>
        </div>
      </footer>
    </div>
  );
}
