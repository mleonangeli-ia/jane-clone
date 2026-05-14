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
    update: {
      name: "Lic. Florencia Lucchini",
      slug: "florencia-lucchini",
      bio: "Psicóloga clínica con orientación cognitivo-conductual. Atención de adultos y adolescentes.",
      phone: "+54 11 1234-5678",
      address: "Av. Santa Fe 2500, CABA",
      accentColor: "#7C3AED",
    },
    create: {
      name: "Lic. Florencia Lucchini",
      slug: "florencia-lucchini",
      email: "demo@janeclone.com",
      passwordHash,
      bio: "Psicóloga clínica con orientación cognitivo-conductual. Atención de adultos y adolescentes.",
      phone: "+54 11 1234-5678",
      address: "Av. Santa Fe 2500, CABA",
      accentColor: "#7C3AED",
    },
  });

  // Delete appointments (and payments via cascade) before services
  await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.service.createMany({
    data: [
      { tenantId: tenant.id, name: "Consulta inicial",        duration: 60, price: 600000, color: "#7C3AED" },
      { tenantId: tenant.id, name: "Sesión individual",       duration: 50, price: 500000, color: "#6366F1" },
      { tenantId: tenant.id, name: "Sesión de pareja",        duration: 80, price: 700000, color: "#EC4899" },
      { tenantId: tenant.id, name: "Evaluación psicológica",  duration: 90, price: 900000, color: "#0EA5E9" },
    ],
  });

  await prisma.availability.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.availability.createMany({
    data: [
      { tenantId: tenant.id, dayOfWeek: 1, startTime: "10:00", endTime: "19:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 2, startTime: "10:00", endTime: "19:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 3, startTime: "10:00", endTime: "14:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 4, startTime: "10:00", endTime: "19:00", isActive: true },
      { tenantId: tenant.id, dayOfWeek: 5, startTime: "10:00", endTime: "16:00", isActive: true },
    ],
  });

  console.log(`Seed completado. Tenant: ${tenant.slug}`);
  console.log(`Login: demo@janeclone.com / demo1234`);
  console.log(`Booking: http://localhost:3000/book/florencia-lucchini`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
