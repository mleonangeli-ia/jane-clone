import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Clock, ArrowRight, CheckCircle, Star } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda online 24/7",
    desc: "Tus pacientes reservan sus turnos en cualquier momento, desde cualquier dispositivo.",
    color: "from-violet-500 to-indigo-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    icon: Users,
    title: "Gestión de clientes",
    desc: "Historial completo, notas clínicas y datos de contacto siempre a mano.",
    color: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50",
    text: "text-sky-600",
  },
  {
    icon: CreditCard,
    title: "Pagos con MercadoPago",
    desc: "Cobrá al momento de la reserva. El dinero cae directo en tu cuenta.",
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    icon: Clock,
    title: "Disponibilidad flexible",
    desc: "Configurá tus horarios una vez y el sistema gestiona el resto automáticamente.",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
];

const benefits = [
  "Sin cuotas de instalación",
  "Configuración en menos de 5 minutos",
  "Tu link personalizado de reservas",
  "Recordatorios automáticos por email",
  "Panel de gestión en tiempo real",
  "Soporte en español",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">JaneClone</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-100/40 via-transparent to-transparent" />

          <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              Plataforma de turnos para profesionales de la salud
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Tu agenda online,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                sin complicaciones
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-500 leading-relaxed">
              Creá tu perfil, compartí tu link y empezá a recibir turnos hoy mismo.
              Sin configuraciones complejas, sin costos ocultos.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-base shadow-xl shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700"
                >
                  Crear cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/book/florencia-lucchini">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base border-gray-200 hover:bg-gray-50">
                  Ver demo en vivo
                </Button>
              </Link>
            </div>

            <p className="mt-4 text-sm text-gray-400">No se requiere tarjeta de crédito</p>
          </div>
        </section>

        {/* Benefits strip */}
        <section className="border-y border-gray-100 bg-gray-50/50 py-5">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Todo lo que necesitás para gestionar tu práctica
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Diseñado para kinesiólogos, psicólogos, nutricionistas y cualquier profesional de la salud.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc, bg, text }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
              >
                <div className={`mb-4 inline-flex rounded-xl ${bg} p-3`}>
                  <Icon className={`h-6 w-6 ${text}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_white/10,_transparent)]" />
            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Listo para empezar?
            </h2>
            <p className="relative mt-4 text-lg text-indigo-200">
              Configurá tu agenda en menos de 5 minutos y empezá a recibir reservas hoy.
            </p>
            <div className="relative mt-8">
              <Link href="/register">
                <Button size="lg" className="h-14 gap-2 bg-white px-10 text-base font-semibold text-indigo-600 shadow-xl hover:bg-gray-50">
                  Crear mi cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2026 JaneClone · Plataforma de turnos online
      </footer>
    </div>
  );
}
