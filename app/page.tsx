import Link from "next/link";
import { Calendar, Users, CreditCard, Clock, ArrowRight, CheckCircle, Zap, Shield, Globe } from "lucide-react";

const stats = [
  { value: "500+", label: "Profesionales" },
  { value: "50k+", label: "Turnos gestionados" },
  { value: "5 min", label: "Para configurar" },
  { value: "0 $", label: "Para empezar" },
];

const features = [
  {
    icon: Calendar,
    title: "Agenda online 24/7",
    desc: "Tus pacientes reservan sus turnos en cualquier momento. Sin llamadas, sin WhatsApps.",
    accent: "#6366f1",
    bg: "#eef2ff",
  },
  {
    icon: Users,
    title: "Gestión de clientes",
    desc: "Historial completo, notas clínicas y datos de contacto siempre a mano.",
    accent: "#0ea5e9",
    bg: "#f0f9ff",
  },
  {
    icon: CreditCard,
    title: "Pagos con MercadoPago",
    desc: "Cobrá al momento de la reserva. El dinero cae directo en tu cuenta.",
    accent: "#10b981",
    bg: "#f0fdf4",
  },
  {
    icon: Globe,
    title: "Multiidioma",
    desc: "Tu página de reservas disponible en español, inglés y portugués.",
    accent: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    icon: Shield,
    title: "Seguridad total",
    desc: "Rate limiting, CAPTCHA, headers de seguridad. Tu cuenta y tus datos protegidos.",
    accent: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    icon: Zap,
    title: "Recordatorios automáticos",
    desc: "Emails automáticos al confirmar el turno. Menos no-shows, más tranquilidad.",
    accent: "#ef4444",
    bg: "#fef2f2",
  },
];

const testimonials = [
  {
    quote: "Desde que uso JaneClone mis pacientes reservan solos. Ya no pierdo tiempo coordinando por WhatsApp.",
    name: "Lic. Florencia L.",
    role: "Psicóloga, CABA",
    initial: "F",
    color: "#7c3aed",
  },
  {
    quote: "Configuré todo en 10 minutos y al día siguiente ya tenía reservas. Increíble lo simple que es.",
    name: "Dr. Martín S.",
    role: "Kinesiólogo, Rosario",
    initial: "M",
    color: "#2563eb",
  },
  {
    quote: "El cobro automático con MercadoPago me cambió la vida. Cero turnos sin pagar.",
    name: "Lic. Ana R.",
    role: "Nutricionista, Córdoba",
    initial: "A",
    color: "#059669",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>

      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">JaneClone</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Testimonios</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <button className="hidden rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors sm:block">
                Iniciar sesión
              </button>
            </Link>
            <Link href="/register">
              <button className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 hover:shadow-xl hover:shadow-indigo-200/80 transition-all hover:-translate-y-0.5">
                Empezar gratis
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-32">
          {/* Background gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />

          <div className="relative mx-auto max-w-5xl px-6 text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Disponible para profesionales de la salud
            </div>

            {/* Headline */}
            <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Tu agenda online,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                sin complicaciones
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
              Creá tu perfil profesional, compartí tu link y empezá a recibir reservas en minutos. Sin configuraciones complejas.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register">
                <button className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 text-base font-semibold text-white shadow-xl shadow-indigo-200/60 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-200">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/book/florencia-lucchini">
                <button className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 px-7 text-base font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50">
                  Ver demo en vivo
                </button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-400">Sin tarjeta de crédito · Gratis para empezar</p>

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-sm">
                  <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto mt-20 max-w-5xl px-6">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-2xl shadow-gray-900/10">
              {/* Mockup header */}
              <div className="flex items-center gap-1.5 bg-gray-900 px-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <div className="mx-auto flex h-5 w-48 items-center rounded-md bg-gray-800 px-2">
                  <span className="text-xs text-gray-400">janeclone.vercel.app/dashboard</span>
                </div>
              </div>
              {/* Mockup content */}
              <div className="flex bg-gray-50" style={{ height: "400px" }}>
                {/* Sidebar mock */}
                <div className="hidden w-48 shrink-0 flex-col gap-1 bg-gray-950 p-3 sm:flex">
                  <div className="mb-3 flex items-center gap-2 px-2 py-1">
                    <div className="h-5 w-5 rounded-md bg-indigo-600" />
                    <div className="h-2.5 w-16 rounded bg-gray-700" />
                  </div>
                  {["Inicio", "Agenda", "Clientes", "Servicios", "Configuración"].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${i === 0 ? "bg-white/10" : ""}`}>
                      <div className={`h-3 w-3 rounded ${i === 0 ? "bg-indigo-400" : "bg-gray-700"}`} />
                      <div className={`h-2 rounded ${i === 0 ? "bg-gray-200 w-8" : "bg-gray-700 w-10"}`} />
                    </div>
                  ))}
                </div>
                {/* Main content mock */}
                <div className="flex-1 overflow-hidden p-6">
                  {/* Stat cards row */}
                  <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { label: "Turnos hoy", val: "4", color: "#6366f1" },
                      { label: "Clientes", val: "28", color: "#0ea5e9" },
                      { label: "Cobrado", val: "$12k", color: "#10b981" },
                      { label: "Pendientes", val: "2", color: "#f59e0b" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                        <p className="text-[10px] text-gray-400">{card.label}</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">{card.val}</p>
                        <div className="mt-2 h-0.5 w-full rounded-full" style={{ background: card.color }} />
                      </div>
                    ))}
                  </div>
                  {/* Appointment list mock */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <div className="h-2.5 w-24 rounded bg-gray-900" />
                    </div>
                    {[
                      { time: "09:00", name: "María García", service: "Consulta inicial", color: "#6366f1", paid: true },
                      { time: "10:00", name: "Carlos López", service: "Sesión individual", color: "#0ea5e9", paid: true },
                      { time: "11:30", name: "Ana Rodríguez", service: "Evaluación", color: "#10b981", paid: false },
                    ].map((apt) => (
                      <div key={apt.time} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0">
                        <div className="w-10 text-center">
                          <span className="text-xs font-bold text-gray-700">{apt.time}</span>
                        </div>
                        <div className="h-8 w-0.5 rounded-full" style={{ background: apt.color }} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{apt.name}</p>
                          <p className="text-[10px] text-gray-400">{apt.service}</p>
                        </div>
                        <div className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${apt.paid ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {apt.paid ? "Pagado" : "Pendiente"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Glow effect behind mockup */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-indigo-200/30 via-violet-200/30 to-purple-200/30 blur-2xl" />
          </div>
        </section>

        {/* ── Benefits strip ─────────────────────────────────── */}
        <section className="border-y border-gray-100 bg-gray-50/50 py-4">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {[
                "Sin costos de instalación",
                "Tu link propio de reservas",
                "Emails automáticos",
                "Pagos con MercadoPago",
                "Multiidioma ES/EN/PT",
                "Seguridad incluida",
              ].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Funcionalidades</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Todo lo que necesitás en un solo lugar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Diseñado para psicólogos, kinesiólogos, nutricionistas y cualquier profesional de la salud.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, accent, bg }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: bg }}
                >
                  <Icon className="h-6 w-6" style={{ color: accent }} />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: accent }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ───────────────────────────────────── */}
        <section id="testimonials" className="bg-gray-50/80 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Testimonios</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Profesionales que ya lo usan
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-600">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: t.color }}
                    >
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-8 py-16 text-center shadow-2xl shadow-indigo-200">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)", backgroundSize: "48px 48px" }}
            />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Listo para empezar?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-indigo-200">
                Configurá tu agenda en menos de 5 minutos y empezá a recibir reservas hoy.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <button className="flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-indigo-600 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl">
                    Crear mi cuenta gratis
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/book/florencia-lucchini">
                  <button className="flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">
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
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Calendar className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">JaneClone</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 JaneClone · Plataforma de turnos para profesionales de la salud</p>
        </div>
      </footer>
    </div>
  );
}
