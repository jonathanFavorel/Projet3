require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function tableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `,
      tableName
    );
    return result[0].exists;
  } catch (error) {
    console.log(
      `Erreur lors de la vérification de l'existence de la table ${tableName}:`,
      error.message
    );
    return false;
  }
}

async function cleanDb() {
  try {
    // Désactive les contraintes de clé étrangère (Postgres)
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

    // Liste des tables à nettoyer (adapter selon ton schéma)
    const tables = [
      '_Report',
      'message',
      '_Comment',
      'trade',
      'tradingAccount',
      'currency',
      'accountStats',
      '_Analysis',
      '_User',
      'propFirm',
      'role',
      'userHaveRole',
    ];

    for (const table of tables) {
      const exists = await tableExists(table);
      if (exists) {
        console.log(`Nettoyage de la table ${table}...`);
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`
        );
      } else {
        console.log(`Table ${table} n'existe pas, ignorée.`);
      }
    }

    // Réactive les contraintes
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    console.log('Nettoyage de la base de données terminé avec succès.');
  } catch (error) {
    console.error(
      'Erreur lors du nettoyage de la base de données:',
      error.message
    );
    throw error;
  }
}

cleanDb()
  .catch(e => {
    console.error('Erreur nettoyage DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
