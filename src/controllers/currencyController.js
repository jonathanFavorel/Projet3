const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une devise
exports.createCurrency = async (req, res) => {
  try {
    const { name, symbol, contractSize, type } = req.body;
    if (!name || !symbol || !contractSize || !type) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs requis manquants' });
    }
    const currency = await prisma.currency.create({
      data: { name, symbol, contractSize, type },
    });
    res.status(201).json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer toutes les devises
exports.getAllCurrencies = async (req, res) => {
  try {
    const currencies = await prisma.currency.findMany();
    res.json({ success: true, data: currencies });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer une devise par ID
exports.getCurrencyById = async (req, res) => {
  try {
    const { id } = req.params;
    const currency = await prisma.currency.findUnique({
      where: { idCurrency: id },
    });
    if (!currency) {
      return res
        .status(404)
        .json({ success: false, message: 'Devise non trouvée' });
    }
    res.json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Mettre à jour une devise
exports.updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, contractSize, type } = req.body;
    const currency = await prisma.currency.update({
      where: { idCurrency: id },
      data: { name, symbol, contractSize, type },
    });
    res.json({ success: true, data: currency });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Devise non trouvée' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Supprimer une devise
exports.deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.currency.delete({ where: { idCurrency: id } });
    res.json({ success: true, message: 'Devise supprimée' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Devise non trouvée' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
