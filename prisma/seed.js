const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Hash des mots de passe
  const password = await bcrypt.hash('Test1234!', 10);

  // Création d'un admin
  await prisma.user.create({
    data: {
      nameTag: 'admin',
      firstname: 'Admin',
      lastname: 'Test',
      email: 'admin@test.com',
      password,
      isAdmin: true,
    },
  });

  // Création d'un utilisateur simple
  await prisma.user.create({
    data: {
      nameTag: 'user',
      firstname: 'User',
      lastname: 'Test',
      email: 'user@test.com',
      password,
      isAdmin: false,
    },
  });

  console.log('Utilisateurs de test créés.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
