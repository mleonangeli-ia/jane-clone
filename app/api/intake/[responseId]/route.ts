import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyIntakeToken } from "@/lib/intake-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { responseId } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";

  const response = await prisma.formResponse.findUnique({
    where: { id: responseId },
    include: {
      form: {
        include: { fields: { orderBy: { position: "asc" } } },
      },
      appointment: {
        include: {
          service: { select: { name: true } },
          tenant: { select: { name: true } },
        },
      },
    },
  });

  if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyIntakeToken(token, response.id, response.createdAt)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  return NextResponse.json({
    id: response.id,
    submittedAt: response.submittedAt,
    form: {
      id: response.form.id,
      name: response.form.name,
      description: response.form.description,
      fields: response.form.fields,
    },
    serviceName: response.appointment.service.name,
    professional: response.appointment.tenant.name,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { responseId } = await params;
  const { token, answers } = await req.json();

  const response = await prisma.formResponse.findUnique({
    where: { id: responseId },
  });

  if (!response) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!verifyIntakeToken(token, response.id, response.createdAt)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (response.submittedAt !== null) {
    return NextResponse.json({ error: "Ya fue respondido" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.formAnswer.createMany({
      data: (answers as { fieldId: string; value: string }[]).map((a) => ({
        responseId: response.id,
        fieldId: a.fieldId,
        value: a.value,
      })),
    });

    await tx.formResponse.update({
      where: { id: response.id },
      data: { submittedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
