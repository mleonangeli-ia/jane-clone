import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FieldType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const form = await prisma.intakeForm.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { position: "asc" } },
      services: true,
    },
  });

  if (!form || form.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(form);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, description, fields } = await req.json();
  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const existing = await prisma.intakeForm.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await prisma.$transaction(async (tx) => {
    await tx.intakeForm.update({
      where: { id },
      data: { name, description: description ?? null },
    });

    await tx.intakeFormField.deleteMany({ where: { formId: id } });

    if (Array.isArray(fields) && fields.length > 0) {
      await tx.intakeFormField.createMany({
        data: fields.map(
          (f: { label: string; type: string; options?: string; required?: boolean; position?: number }) => ({
            formId: id,
            label: f.label,
            type: f.type as FieldType,
            options: f.options ?? null,
            required: f.required ?? false,
            position: f.position ?? 0,
          })
        ),
      });
    }

    return tx.intakeForm.findUnique({
      where: { id },
      include: { fields: { orderBy: { position: "asc" } } },
    });
  });

  return NextResponse.json(form);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.intakeForm.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.service.updateMany({ where: { intakeFormId: id }, data: { intakeFormId: null } }),
    prisma.intakeForm.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
