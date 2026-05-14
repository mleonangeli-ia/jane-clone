import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const passwordHash = await hash(password, 12);
  const tenant = await prisma.tenant.create({
    data: { name, email, passwordHash, slug },
  });

  return NextResponse.json({ id: tenant.id, slug: tenant.slug }, { status: 201 });
}
