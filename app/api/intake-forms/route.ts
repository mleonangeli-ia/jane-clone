import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FieldType } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forms = await prisma.intakeForm.findMany({
    where: { tenantId: session.user.id },
    include: {
      fields: { orderBy: { position: "asc" } },
      _count: { select: { responses: true, services: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(forms);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, fields } = await req.json();
  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  const form = await prisma.$transaction(async (tx) => {
    const created = await tx.intakeForm.create({
      data: {
        tenantId: session.user.id,
        name,
        description: description ?? undefined,
      },
    });

    if (Array.isArray(fields) && fields.length > 0) {
      await tx.intakeFormField.createMany({
        data: fields.map(
          (f: { label: string; type: string; options?: string; required?: boolean; position?: number }) => ({
            formId: created.id,
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
      where: { id: created.id },
      include: { fields: { orderBy: { position: "asc" } } },
    });
  });

  return NextResponse.json(form, { status: 201 });
}
