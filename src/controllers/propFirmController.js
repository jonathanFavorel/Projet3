const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une firme de trading
exports.createPropFirm = async (req, res) => {
  try {
    const { name, logoUrl } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs requis manquants' });
    }
    const propFirm = await prisma.propFirm.create({
      data: { name, logoUrl },
    });
    res.status(201).json({ success: true, data: propFirm });
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

// Récupérer toutes les firmes de trading
exports.getAllPropFirms = async (req, res) => {
  try {
    const propFirms = await prisma.propFirm.findMany();
    res.json({ success: true, data: propFirms });
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

// Récupérer une firme de trading par ID
exports.getPropFirmById = async (req, res) => {
  try {
    const { id } = req.params;
    const propFirm = await prisma.propFirm.findUnique({
      where: { idPropFirm: id },
    });
    if (!propFirm) {
      return res
        .status(404)
        .json({ success: false, message: 'Firme de trading non trouvée' });
    }
    res.json({ success: true, data: propFirm });
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

// Mettre à jour une firme de trading
exports.updatePropFirm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logoUrl } = req.body;
    const propFirm = await prisma.propFirm.update({
      where: { idPropFirm: id },
      data: { name, logoUrl },
    });
    res.json({ success: true, data: propFirm });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Firme de trading non trouvée' });
    }
    res
      .status(500)
      .json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
  }
};

// Supprimer une firme de trading
exports.deletePropFirm = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.propFirm.delete({ where: { idPropFirm: id } });
    res.json({ success: true, message: 'Firme de trading supprimée' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Firme de trading non trouvée' });
    }
    res
      .status(500)
      .json({
        success: false,
        message: 'Erreur serveur',
        error: error.message,
      });
  }
};
