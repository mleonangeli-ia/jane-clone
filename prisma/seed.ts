import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash("demo1234", 12);

  const tenant = await prisma.tenant.upsert({
    where: { email: "demo@janeclone.com" },
    update: {},
    create: {
      name: "Dra. María González",
      slug: "maria-gonzalez",
      email: "demo@janeclone.com",
      passwordHash,
      bio: "Kinesióloga especializada en rehabilitación deportiva. +10 años de experiencia.",
      phone: "+54 11 1234-5678",
      address: "Av. Corrientes 1234, CABA",
      accentColor: "#4F46E5",
    },
  });

  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, name: "Consulta inicial", duration: 60, price: 500000, color: "#4F46E5" },
      { tenantId: tenant.id, name: "Sesión de kinesiología", duration: 45, price: 350000, color: "#0EA5E9" },
      { tenantId: tenant.id, name: "Masaje descontracturante", duration: 60, price: 450000, color: "#10B981" },
      { tenantId: tenant.id, name: "Rehabilitación post-quirúrgica", duration: 90, price: 600000, color: "#F59E0B" },
    ],
  });

  await prisma.availability.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 3, startTime: "09:00", endTime: "13:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isActive: true },
    ],
  });

  console.log(`Seed completado. Tenant: ${tenant.slug}`);
  console.log(`Login: demo@janeclone.com / demo1234`);
  console.log(`Booking: http://localhost:3000/book/maria-gonzalez`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
