import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

function escapeCsv(val: string | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { tenantId: session.user.id },
    include: {
      appointments: {
        where:   { status: { notIn: ["CANCELLED"] } },
        include: { service: true },
        orderBy: { startTime: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const headers = ["Nombre", "Email", "Teléfono", "Notas", "Turnos", "Último turno", "Revenue total"];
  const rows = clients.map(c => {
    const revenue    = c.appointments.filter(a => a.paymentStatus === "PAID").reduce((s, a) => s + a.service.price, 0);
    const lastApt    = c.appointments[0];
    const lastDate   = lastApt ? format(lastApt.startTime, "yyyy-MM-dd") : "";
    return [
      escapeCsv(c.name),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.notes),
      c.appointments.length,
      lastDate,
      (revenue / 100).toFixed(2),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `clientes-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new NextResponse("﻿" + csv, {  // BOM for Excel UTF-8
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
