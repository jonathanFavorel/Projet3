const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Récupérer tous les trades
exports.getAllTrades = async (req, res) => {
  try {
    const trades = await prisma.trade.findMany();
    res.status(200).json({ success: true, data: trades });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trades',
      error: error.message,
    });
  }
};

// Récupérer un trade par ID
exports.getTradeById = async (req, res) => {
  try {
    const trade = await prisma.trade.findUnique({
      where: { idTrade: req.params.id },
    });
    if (!trade) {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    res.status(200).json({ success: true, data: trade });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trade',
      error: error.message,
    });
  }
};

// Fonction utilitaire pour recalculer toutes les stats d'un compte
async function recalculateAccountStats(idTradingAccount) {
  // Récupérer les trades avec les informations de la devise
  const trades = await prisma.trade.findMany({
    where: { idTradingAccount },
    include: {
      currency: true, // Inclure les informations de la devise pour avoir contractSize
    },
  });

  const totalTrade = trades.length;
  const winningTrades = trades.filter(t => t.exitPrice - t.entryPrice > 0);
  const losingTrades = trades.filter(t => t.exitPrice - t.entryPrice < 0);
  const breakEvenTrades = trades.filter(t => t.exitPrice - t.entryPrice === 0);

  // Calculer le profit en tenant compte du contractSize
  const profit = trades.reduce(
    (acc, t) =>
      acc +
      Math.max(
        0,
        (t.exitPrice - t.entryPrice) * t.quantity * t.currency.contractSize
      ),
    0
  );

  // Calculer la perte en tenant compte du contractSize
  const loss = trades.reduce(
    (acc, t) =>
      acc +
      Math.min(
        0,
        (t.exitPrice - t.entryPrice) * t.quantity * t.currency.contractSize
      ),
    0
  );

  const winRate =
    totalTrade > 0 ? (winningTrades.length / totalTrade) * 100 : 0;

  // Calculer la moyenne des gains en tenant compte du contractSize
  const averageWin =
    winningTrades.length > 0
      ? winningTrades.reduce(
          (acc, t) =>
            acc +
            (t.exitPrice - t.entryPrice) * t.quantity * t.currency.contractSize,
          0
        ) / winningTrades.length
      : 0;

  // Calculer la moyenne des pertes en tenant compte du contractSize
  const averageLoss =
    losingTrades.length > 0
      ? losingTrades.reduce(
          (acc, t) =>
            acc +
            (t.exitPrice - t.entryPrice) * t.quantity * t.currency.contractSize,
          0
        ) / losingTrades.length
      : 0;

  const profitFactor = Math.abs(loss) > 0 ? profit / Math.abs(loss) : 0;

  // Calculer la moyenne des trades en tenant compte du contractSize
  const averageTrade =
    totalTrade > 0
      ? trades.reduce(
          (acc, t) =>
            acc +
            (t.exitPrice - t.entryPrice) * t.quantity * t.currency.contractSize,
          0
        ) / totalTrade
      : 0;

  await prisma.accountStats.upsert({
    where: { idTradingAccount },
    update: {
      totalTrade,
      winningTrade: winningTrades.length,
      losingTrade: losingTrades.length,
      breakEvenTrade: breakEvenTrades.length,
      profit,
      loss,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      averageTrade,
    },
    create: {
      idTradingAccount,
      totalTrade,
      winningTrade: winningTrades.length,
      losingTrade: losingTrades.length,
      breakEvenTrade: breakEvenTrades.length,
      profit,
      loss,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      averageTrade,
      rankAccount: 1,
    },
  });
}

// Créer un nouveau trade
exports.createTrade = async (req, res) => {
  try {
    const trade = await prisma.trade.create({ data: req.body });
    await recalculateAccountStats(trade.idTradingAccount);
    res.status(201).json({ success: true, data: trade });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la création du trade',
      error: error.message,
    });
  }
};

// Mettre à jour un trade
exports.updateTrade = async (req, res) => {
  try {
    const trade = await prisma.trade.update({
      where: { idTrade: req.params.id },
      data: req.body,
    });
    await recalculateAccountStats(trade.idTradingAccount);
    res.status(200).json({ success: true, data: trade });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du trade',
      error: error.message,
    });
  }
};

// Supprimer un trade
exports.deleteTrade = async (req, res) => {
  try {
    // On récupère d'abord le trade pour avoir l'idTradingAccount
    const trade = await prisma.trade.findUnique({
      where: { idTrade: req.params.id },
    });
    if (!trade) {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    await prisma.trade.delete({ where: { idTrade: req.params.id } });
    await recalculateAccountStats(trade.idTradingAccount);
    res
      .status(200)
      .json({ success: true, message: 'Trade supprimé avec succès' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la suppression du trade',
      error: error.message,
    });
  }
};
