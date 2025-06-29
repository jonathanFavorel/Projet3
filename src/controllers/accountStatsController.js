const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/v1/accounts/:id/stats
exports.getAccountStats = async (req, res) => {
  try {
    // Vérifier que le compte de trading existe
    const tradingAccount = await prisma.tradingAccount.findUnique({
      where: { idTradingAccount: req.params.id },
    });
    console.log('[DEBUG] idTradingAccount reçu :', req.params.id);
    console.log('[DEBUG] tradingAccount trouvé :', tradingAccount);

    if (!tradingAccount) {
      return res.status(404).json({
        success: false,
        message: 'Statistiques non trouvées',
      });
    }

    // Vérifier l'autorisation : l'utilisateur doit être propriétaire du compte ou admin
    if (tradingAccount.idUser !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit',
      });
    }

    // Chercher la stat
    const stats = await prisma.accountStats.findUnique({
      where: { idTradingAccount: req.params.id },
    });
    console.log('[DEBUG] stats trouvées :', stats);
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Statistiques non trouvées',
      });
    }
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques.',
        error: error.message,
      });
  }
};
