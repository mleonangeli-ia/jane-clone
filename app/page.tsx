import Link from "next/link";
import { Calendar, Users, CreditCard, Clock, ArrowRight, CheckCircle, Zap, Shield, Globe } from "lucide-react";

const stats = [
  { value: "500+", label: "Profesionales" },
  { value: "50k+", label: "Turnos" },
  { value: "5 min", label: "Configuración" },
  { value: "0 $", label: "Para empezar" },
];

const features = [
  { icon: Calendar,   title: "Agenda online 24/7",       desc: "Tus pacientes reservan sus turnos en cualquier momento, sin llamadas ni WhatsApps." },
  { icon: Users,      title: "Gestión de clientes",       desc: "Historial completo, notas y datos de contacto siempre a mano." },
  { icon: CreditCard, title: "Pagos con MercadoPago",     desc: "Cobrá al momento de la reserva. El dinero cae directo en tu cuenta." },
  { icon: Globe,      title: "Multiidioma",               desc: "Tu página disponible en español, inglés y portugués." },
  { icon: Shield,     title: "Seguridad incluida",        desc: "Rate limiting, CAPTCHA y headers de seguridad desde el día 1." },
  { icon: Zap,        title: "Recordatorios automáticos", desc: "Emails automáticos al confirmar. Menos no-shows, más tranquilidad." },
];

const testimonials = [
  { quote: "Desde que uso JaneClone mis pacientes reservan solos. Ya no pierdo tiempo coordinando.", name: "Lic. Florencia L.", role: "Psicóloga, CABA",     initials: "FL" },
  { quote: "Configuré todo en 10 minutos y al día siguiente ya tenía mis primeras reservas.",       name: "Dr. Martín S.",   role: "Kinesiólogo, Rosario", initials: "MS" },
  { quote: "El cobro con MercadoPago me cambió la vida. Cero turnos sin pagar.",                   name: "Lic. Ana R.",     role: "Nutricionista, Cba.",  initials: "AR" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white">JaneClone</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#testimonials" className="text-sm text-white/70 hover:text-white transition-colors">Testimonios</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login">
              <button className="hidden rounded-xl px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all sm:block">
                Iniciar sesión
              </button>
            </Link>
            <Link href="/register">
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                Empezar gratis
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero con imagen de fondo ──────────────────────── */}
        <section className="relative flex min-h-[90vh] items-center overflow-hidden">

          {/* Imagen de fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')",
            }}
          />

          {/* Overlay oscuro en gradiente */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Contenido */}
          <div className="relative mx-auto max-w-6xl w-full px-6 py-32">
            <div className="max-w-2xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Para profesionales de la salud
              </div>

              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Tu agenda online,
                <br />
                <span className="text-indigo-400">sin complicaciones</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
                Creá tu perfil, compartí tu link y empezá a recibir reservas hoy mismo. Sin configuraciones complejas, sin costos ocultos.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <button className="flex h-13 items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-900/40 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-2xl">
                    Crear cuenta gratis
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                <Link href="/book/florencia-lucchini">
                  <button className="flex h-13 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">
                    Ver demo en vivo
                  </button>
                </Link>
              </div>

              <p className="mt-4 text-sm text-white/40">Sin tarjeta de crédito · Gratis para empezar</p>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:max-w-xl">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Benefits strip ─────────────────────────────────── */}
        <section className="border-y border-gray-100 bg-white py-5">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {["Sin costos de instalación", "Tu link propio de reservas", "Emails automáticos", "Pagos con MercadoPago", "Multiidioma ES/EN/PT", "Seguridad incluida"].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section id="features" className="bg-gray-950 py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-400">Funcionalidades</p>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
                Todo lo que necesitás en un solo lugar
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-400">
                Diseñado para psicólogos, kinesiólogos, nutricionistas y cualquier profesional de la salud.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/8 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/10">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="mb-2 font-bold text-white" style={{ letterSpacing: "-0.02em" }}>{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-indigo-600 transition-all duration-500 group-hover:w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────── */}
        <section id="testimonials" className="bg-gray-950 pb-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-400">Testimonios</p>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
                Profesionales que ya lo usan
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl border border-white/5 bg-white/5 p-6">
                  <p className="text-sm leading-relaxed text-gray-300">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ──────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-black/65" />

          <div className="relative px-8 py-24 text-center">
            <h2 className="text-3xl font-black text-white sm:text-5xl" style={{ letterSpacing: "-0.03em" }}>
              Listo para empezar?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-white/60">
              Configurá tu agenda en menos de 5 minutos. Gratis para siempre en el plan básico.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register">
                <button className="flex h-13 items-center gap-2 rounded-xl bg-white px-10 py-3.5 text-base font-black text-gray-900 shadow-2xl transition-all hover:-translate-y-0.5">
                  Crear mi cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/book/florencia-lucchini">
                <button className="flex h-13 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-10 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">
                  Ver demo
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600">
              <Calendar className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-800">JaneClone</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 JaneClone · Plataforma de turnos para profesionales de la salud</p>
        </div>
      </footer>
    </div>
  );
}
