import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findMany({
    where: { tenantId: session.user.id },
    include: {
      availability: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, title, bio, phone, accentColor } = await req.json();
  if (!name) return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });

  // Auto-generate unique slug
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let i = 1;
  while (await prisma.staff.findUnique({ where: { tenantId_slug: { tenantId: session.user.id, slug } } })) {
    slug = `${baseSlug}-${i++}`;
  }

  // Activate clinic mode on the tenant
  await prisma.tenant.update({
    where: { id: session.user.id },
    data: { isClinic: true },
  });

  const member = await prisma.staff.create({
    data: {
      tenantId:   session.user.id,
      name,
      slug,
      title:      title ?? null,
      bio:        bio ?? null,
      phone:      phone ?? null,
      accentColor: accentColor ?? "#10b981",
    },
  });

  return NextResponse.json(member, { status: 201 });
}
