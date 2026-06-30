/**
 * Script de inicialización: crea el primer usuario administrador.
 * Ejecutar con: npm run seed
 *
 * Lee las credenciales de las variables de entorno SEED_ADMIN_EMAIL,
 * SEED_ADMIN_PASSWORD y SEED_ADMIN_NOMBRE. Si no se proporcionan, usa
 * valores por defecto que DEBES cambiar inmediatamente tras el primer login.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@empresa.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "cambiar1234";
  const nombre = process.env.SEED_ADMIN_NOMBRE || "Administrador";

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    console.log(`Ya existe un usuario con el email ${email}. No se ha creado nada.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.user.create({
    data: {
      email,
      nombre,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Usuario administrador creado:");
  console.log(`  Email: ${usuario.email}`);
  console.log(`  Contraseña: ${password}`);
  console.log("\n⚠️  Cambia esta contraseña después de iniciar sesión por primera vez.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
