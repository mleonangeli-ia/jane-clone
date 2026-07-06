import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AfipConfigForm } from "@/components/afip/AfipConfigForm";
import { ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

const TIPO_COMP_OPTIONS = [
  { value: 11, label: "Factura C (Monotributista)" },
  { value: 6,  label: "Factura B (RI → Consumidor Final)" },
  { value: 1,  label: "Factura A (RI → RI)" },
];

export default async function AfipSettingsPage() {
  const session = await getServerSession(authOptions);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.id },
    select: {
      taxId: true, taxCondition: true,
      afipEnabled: true, afipEnv: true,
      afipPuntoVenta: true, afipTipoComp: true,
      afipCert: true,   // solo para saber si está cargado
    },
  });

  const hasCert = !!tenant?.afipCert;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/settings" className="mb-4 flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          ← Volver a Configuración
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
          Facturación Electrónica AFIP
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Conectá tu cuenta de AFIP para emitir comprobantes electrónicos con CAE.
        </p>
      </div>

      {/* Prerequisites check */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Prerequisitos
        </h2>

        <PrereqItem
          ok={!!tenant?.taxId}
          label="CUIT/CUIL cargado"
          detail={tenant?.taxId ?? "No configurado"}
          link="/dashboard/settings"
          linkText="Ir a Configuración"
        />
        <PrereqItem
          ok={!!tenant?.taxCondition}
          label="Condición IVA definida"
          detail={tenant?.taxCondition ?? "No definida"}
          link="/dashboard/settings"
          linkText="Ir a Configuración"
        />
        <PrereqItem
          ok={hasCert}
          label="Certificado digital AFIP cargado"
          detail={hasCert ? "Certificado cargado ✓" : "Pendiente"}
        />
      </div>

      {/* Help */}
      <div className="rounded-2xl border p-5 text-sm space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <p className="font-semibold" style={{ color: "var(--text)" }}>¿Cómo obtener el certificado?</p>
        <ol className="list-decimal list-inside space-y-1.5" style={{ color: "var(--text-muted)" }}>
          <li>Ingresá a <strong>AFIP → Servicios → Administración de Certificados Digitales</strong></li>
          <li>Generá un nuevo certificado para el servicio <strong>wsfe</strong></li>
          <li>Descargá el certificado (.crt) y la clave privada (.key) en formato PEM</li>
          <li>Pegá ambos archivos abajo</li>
        </ol>
        <a
          href="https://auth.afip.gob.ar/contribuyente_/login.xhtml"
          target="_blank"
          className="inline-flex items-center gap-1.5 font-medium"
          style={{ color: "var(--sage)" }}
        >
          Ir a AFIP <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Config form */}
      <AfipConfigForm
        initial={{
          enabled:    tenant?.afipEnabled ?? false,
          env:        (tenant?.afipEnv ?? "homologacion") as "homologacion" | "produccion",
          puntoVenta: tenant?.afipPuntoVenta ?? 1,
          tipoComp:   tenant?.afipTipoComp ?? 11,
          hasCert,
        }}
        tipoCompOptions={TIPO_COMP_OPTIONS}
      />
    </div>
  );
}

function PrereqItem({
  ok, label, detail, link, linkText
}: {
  ok: boolean; label: string; detail: string; link?: string; linkText?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        {ok
          ? <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        }
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{detail}</p>
        </div>
      </div>
      {!ok && link && (
        <Link href={link} className="text-xs font-medium" style={{ color: "var(--sage)" }}>
          {linkText}
        </Link>
      )}
    </div>
  );
}
