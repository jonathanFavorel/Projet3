const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un commentaire
exports.createComment = async (req, res) => {
  try {
    const { content, idAnalysis } = req.body;
    const idUser = req.user.userId; // Récupéré du middleware d'authentification

    if (!content || !idAnalysis) {
      return res
        .status(400)
        .json({ success: false, message: 'Champs requis manquants' });
    }

    const comment = await prisma.comment.create({
      data: { content, idUser, idAnalysis },
      include: {
        user: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer tous les commentaires d'une analyse
exports.getCommentsByAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const comments = await prisma.comment.findMany({
      where: { idAnalysis: analysisId },
      include: {
        user: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer un commentaire par ID
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { idComment: id },
      include: {
        user: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        analysis: {
          select: {
            idAnalysis: true,
            title: true,
          },
        },
      },
    });
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }
    res.json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Mettre à jour un commentaire
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const idUser = req.user.userId;

    // Vérifier que l'utilisateur est propriétaire du commentaire
    const existingComment = await prisma.comment.findUnique({
      where: { idComment: id },
    });

    if (!existingComment) {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }

    if (existingComment.idUser !== idUser) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce commentaire',
      });
    }

    const comment = await prisma.comment.update({
      where: { idComment: id },
      data: { content },
      include: {
        user: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
    res.json({ success: true, data: comment });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const idUser = req.user.userId;

    // Vérifier que l'utilisateur est propriétaire du commentaire
    const existingComment = await prisma.comment.findUnique({
      where: { idComment: id },
    });

    if (!existingComment) {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }

    if (existingComment.idUser !== idUser) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce commentaire',
      });
    }

    await prisma.comment.delete({ where: { idComment: id } });
    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
