"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NEXT_PUBLIC_APP_URL } from "@/lib/constants";

type Tenant = {
  id: string;
  name: string;
  email: string;
  slug: string;
  bio: string | null;
  phone: string | null;
  address: string | null;
  accentColor: string;
  timezone: string;
};

export function SettingsForm({ tenant, isGoogleConnected }: { tenant: Tenant; isGoogleConnected: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    const data = new FormData(e.currentTarget);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        bio: data.get("bio"),
        phone: data.get("phone"),
        address: data.get("address"),
        accentColor: data.get("accentColor"),
        timezone: data.get("timezone"),
      }),
    });
    setSaving(false);
    setSuccess(true);
    router.refresh();
  }

  async function handleDisconnect() {
    await fetch("/api/google-calendar/disconnect", { method: "POST" });
    router.refresh();
  }

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/book/${tenant.slug}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tu link de reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg bg-indigo-50 px-4 py-3">
            <span className="flex-1 text-sm font-mono text-indigo-700 truncate">{bookingUrl}</span>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(bookingUrl)}>
              Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={tenant.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Descripción / Bio</Label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={tenant.bio ?? ""}
                rows={3}
                className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Contá a qué te dedicás..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" defaultValue={tenant.phone ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" defaultValue={tenant.address ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Zona horaria</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={tenant.timezone}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="America/Argentina/Buenos_Aires">Argentina (ARS, UTC-3)</option>
                <option value="America/Santiago">Chile (UTC-3/-4)</option>
                <option value="America/Bogota">Colombia (UTC-5)</option>
                <option value="America/Lima">Perú (UTC-5)</option>
                <option value="America/Mexico_City">México (UTC-6)</option>
                <option value="America/New_York">Nueva York (UTC-5/-4)</option>
                <option value="Europe/Madrid">España (UTC+1/+2)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accentColor">Color de marca</Label>
              <input id="accentColor" name="accentColor" type="color" defaultValue={tenant.accentColor} className="h-10 w-full cursor-pointer rounded-lg border border-gray-200 p-1" />
            </div>
            {success && <p className="text-sm text-green-600">Cambios guardados correctamente.</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Google Calendar</CardTitle></CardHeader>
        <CardContent>
          {isGoogleConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                Conectado — los turnos se sincronizan automáticamente
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>Desconectar</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Sincronizá tus turnos confirmados con Google Calendar</p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/google-calendar/auth"}>
                Conectar Google Calendar
              </Button>
            </div>
          )}
          {searchParams?.get("gc") === "connected" && <p className="mt-2 text-sm text-green-600">¡Google Calendar conectado correctamente!</p>}
          {searchParams?.get("gc") === "error" && <p className="mt-2 text-sm text-red-500">Error al conectar. Intentá de nuevo.</p>}
        </CardContent>
      </Card>

      {/* AFIP */}
      <Card>
        <CardHeader><CardTitle>Facturación Electrónica AFIP</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Emití comprobantes electrónicos con CAE. Requiere certificado digital de AFIP.</p>
            <a href="/dashboard/settings/afip">
              <Button variant="outline" size="sm">Configurar AFIP</Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
