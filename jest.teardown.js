const { execSync } = require('child_process');

module.exports = async () => {
  // Exécute le script de nettoyage Prisma
  try {
    execSync('node prisma/cleanTestDb.js', { stdio: 'inherit' });
  } catch (e) {
    console.error(
      'Erreur lors du nettoyage de la base de test après les tests',
      e
    );
  }
};
