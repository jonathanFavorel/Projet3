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
    res
      .status(500)
      .json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
  }
};

// Squelettes pour extension future
exports.getAllCurrencies = async (req, res) => {
  res.status(501).json({ message: 'Non implémenté' });
};
exports.getCurrencyById = async (req, res) => {
  res.status(501).json({ message: 'Non implémenté' });
};
exports.updateCurrency = async (req, res) => {
  res.status(501).json({ message: 'Non implémenté' });
};
exports.deleteCurrency = async (req, res) => {
  res.status(501).json({ message: 'Non implémenté' });
};
