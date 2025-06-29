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
    res
      .status(500)
      .json({
        success: false,
        message: 'Erreur lors de la récupération du trade',
        error: error.message,
      });
  }
};

// Créer un nouveau trade
exports.createTrade = async (req, res) => {
  try {
    const trade = await prisma.trade.create({ data: req.body });
    res.status(201).json({ success: true, data: trade });
  } catch (error) {
    res
      .status(400)
      .json({
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
    res.status(200).json({ success: true, data: trade });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    res
      .status(400)
      .json({
        success: false,
        message: 'Erreur lors de la mise à jour du trade',
        error: error.message,
      });
  }
};

// Supprimer un trade
exports.deleteTrade = async (req, res) => {
  try {
    await prisma.trade.delete({ where: { idTrade: req.params.id } });
    res
      .status(200)
      .json({ success: true, message: 'Trade supprimé avec succès' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Trade non trouvé' });
    }
    res
      .status(400)
      .json({
        success: false,
        message: 'Erreur lors de la suppression du trade',
        error: error.message,
      });
  }
};
