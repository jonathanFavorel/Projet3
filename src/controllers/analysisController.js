const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer une analyse
exports.createAnalysis = async (req, res) => {
  try {
    const { title, content } = req.body;
    const idUser = req.user && req.user.idUser;
    if (!title || !content || !idUser) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs requis manquants' });
    }
    const analysis = await prisma.analysis.create({
      data: { title, content, idUser },
    });
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer toutes les analyses
exports.getAllAnalyses = async (req, res) => {
  try {
    const analyses = await prisma.analysis.findMany({
      include: { user: true, comments: true, images: true },
    });
    res.json({ success: true, data: analyses });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer une analyse par ID
exports.getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await prisma.analysis.findUnique({
      where: { idAnalysis: id },
      include: { user: true, comments: true, images: true },
    });
    if (!analysis) {
      return res
        .status(404)
        .json({ success: false, message: 'Analyse non trouvée' });
    }
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Mettre à jour une analyse
exports.updateAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const analysis = await prisma.analysis.update({
      where: { idAnalysis: id },
      data: { title, content },
    });
    res.json({ success: true, data: analysis });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Analyse non trouvée' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Supprimer une analyse
exports.deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.analysis.delete({ where: { idAnalysis: id } });
    res.json({ success: true, message: 'Analyse supprimée' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Analyse non trouvée' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
