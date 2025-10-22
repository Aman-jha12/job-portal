import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Hash the admin password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('adminpassword', salt);

  // Create the Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jobportal.com' }, 
    update: {}, // If found, do nothing
    create: {
      email: 'admin@jobportal.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN, 
    },
  });

  console.log(`Created admin user: ${adminUser.email}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });