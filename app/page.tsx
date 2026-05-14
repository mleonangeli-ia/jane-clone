import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CreditCard, Clock } from "lucide-react";

const features = [
  { icon: Calendar, title: "Agenda online", desc: "Tus clientes reservan sus turnos 24/7 desde cualquier dispositivo." },
  { icon: Users, title: "Gestión de clientes", desc: "Historial de visitas, notas y datos de contacto en un solo lugar." },
  { icon: CreditCard, title: "Pagos integrados", desc: "Cobrá al momento de la reserva o en persona con Stripe." },
  { icon: Clock, title: "Disponibilidad flexible", desc: "Configurá tus horarios y dejá que el sistema haga el resto." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold text-indigo-600">JaneClone</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Crear cuenta gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900">
            Tu agenda de turnos,{" "}
            <span className="text-indigo-600">sin complicaciones</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            Plataforma completa para profesionales de la salud y el bienestar.
            Agenda, clientes y pagos en un solo lugar.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Empezar gratis</Button>
            </Link>
            <Link href="/book/demo">
              <Button size="lg" variant="outline">Ver demo de reserva</Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 inline-flex rounded-lg bg-indigo-100 p-2">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
