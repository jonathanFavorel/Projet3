const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware pour vérifier le rôle admin
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.idUser;

    const user = await prisma.user.findUnique({
      where: { idUser: userId },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit - Droits administrateur requis',
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

module.exports = { isAdmin };
