const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un compte de trading
exports.createAccount = async (req, res) => {
  try {
    const { leverage, isPropFirm, amount, idCurrency, idUser, idPropFirm } =
      req.body;
    if (!amount || !idCurrency || !idUser) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs requis manquants' });
    }
    const account = await prisma.tradingAccount.create({
      data: { leverage, isPropFirm, amount, idCurrency, idUser, idPropFirm },
    });
    res.status(201).json({ success: true, data: account });
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

// Récupérer tous les comptes
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await prisma.tradingAccount.findMany({
      include: {
        currency: true,
        user: true,
        propFirm: true,
        trades: true,
        accountStats: true,
      },
    });
    res.json({ success: true, data: accounts });
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

// Récupérer un compte par ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await prisma.tradingAccount.findUnique({
      where: { idTradingAccount: id },
      include: {
        currency: true,
        user: true,
        propFirm: true,
        trades: true,
        accountStats: true,
      },
    });
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: 'Compte non trouvé' });
    }
    res.json({ success: true, data: account });
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

// Mettre à jour un compte
exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { leverage, isPropFirm, amount, idCurrency, idPropFirm } = req.body;
    const account = await prisma.tradingAccount.update({
      where: { idTradingAccount: id },
      data: { leverage, isPropFirm, amount, idCurrency, idPropFirm },
    });
    res.json({ success: true, data: account });
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

// Supprimer un compte
exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tradingAccount.delete({ where: { idTradingAccount: id } });
    res.json({ success: true, message: 'Compte supprimé' });
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

// Récupérer les stats d'un compte
exports.getAccountStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await prisma.accountStats.findUnique({
      where: { idTradingAccount: id },
    });
    if (!stats) {
      return res
        .status(404)
        .json({ success: false, message: 'Stats non trouvées' });
    }
    res.json({ success: true, data: stats });
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
