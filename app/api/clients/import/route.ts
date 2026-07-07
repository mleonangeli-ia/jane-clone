import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consume, getClientIp } from "@/lib/rate-limit";

// Parses a single CSV line respecting quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// Normalize header name
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(req);
  if (!consume(`import:${ip}`, 5, 60 * 60_000).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const text = await file.text();
  // Remove BOM if present
  const content = text.replace(/^﻿/, "");
  const lines   = content.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    return NextResponse.json({ error: "El archivo está vacío o no tiene datos" }, { status: 400 });
  }

  // Parse header row
  const headerRow = parseCsvLine(lines[0]);
  const idx = {
    name:  headerRow.findIndex(h => ["nombre", "name"].includes(norm(h))),
    email: headerRow.findIndex(h => ["email", "correo"].includes(norm(h))),
    phone: headerRow.findIndex(h => ["telefono", "phone", "celular"].includes(norm(h))),
    notes: headerRow.findIndex(h => ["notas", "notes", "observaciones"].includes(norm(h))),
  };

  if (idx.name === -1 || idx.email === -1) {
    return NextResponse.json({
      error: "El CSV debe tener columnas 'Nombre' y 'Email'. Revisá el formato.",
    }, { status: 400 });
  }

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (let i = 1; i < lines.length; i++) {
    const cols  = parseCsvLine(lines[i]);
    const name  = cols[idx.name]?.trim();
    const email = cols[idx.email]?.trim().toLowerCase();
    const phone = idx.phone >= 0 ? (cols[idx.phone]?.trim() || null) : null;
    const notes = idx.notes >= 0 ? (cols[idx.notes]?.trim() || null) : null;

    if (!name || !email) { results.skipped++; continue; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      results.errors.push(`Fila ${i + 1}: email inválido "${email}"`);
      continue;
    }

    try {
      const existing = await prisma.client.findUnique({
        where: { tenantId_email: { tenantId: session.user.id, email } },
      });

      if (existing) {
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            name,
            ...(phone !== null ? { phone } : {}),
            ...(notes !== null ? { notes } : {}),
          },
        });
        results.updated++;
      } else {
        await prisma.client.create({
          data: { tenantId: session.user.id, name, email, phone, notes },
        });
        results.created++;
      }
    } catch {
      results.errors.push(`Fila ${i + 1}: error al procesar "${email}"`);
    }
  }

  return NextResponse.json(results);
}
