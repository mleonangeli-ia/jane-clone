import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { tenantId: true },
  });
  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const note = await prisma.clinicalNote.findUnique({
    where: { appointmentId: id },
  });

  return NextResponse.json(note ?? null);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { tenantId: true },
  });
  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { subjective, objective, assessment, plan } = await req.json();

  const note = await prisma.clinicalNote.upsert({
    where:  { appointmentId: id },
    create: {
      appointmentId: id,
      tenantId:      session.user.id,
      subjective:    subjective ?? null,
      objective:     objective  ?? null,
      assessment:    assessment ?? null,
      plan:          plan       ?? null,
    },
    update: {
      subjective: subjective ?? null,
      objective:  objective  ?? null,
      assessment: assessment ?? null,
      plan:       plan       ?? null,
    },
  });

  return NextResponse.json(note);
}
