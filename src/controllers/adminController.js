const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Statistiques globales
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const connectedUsers = await prisma.user.count({
      where: { isConnected: true },
    });
    const reportedComments = await prisma.report.count({
      where: { idComment: { not: null } },
    });
    const reportedAnalyses = await prisma.report.count({
      where: { idAnalysis: { not: null } },
    });
    res.json({
      success: true,
      data: {
        totalUsers,
        connectedUsers,
        reportedComments,
        reportedAnalyses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Liste des utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        isConnected: true,
        warnings: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Liste des commentaires signalés
exports.getReportedComments = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { idComment: { not: null } },
      include: {
        comment: {
          include: {
            user: { select: { idUser: true, nameTag: true } },
            analysis: { select: { idAnalysis: true, title: true } },
          },
        },
        user: { select: { idUser: true, nameTag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Liste des analyses signalées
exports.getReportedAnalyses = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { idAnalysis: { not: null } },
      include: {
        analysis: {
          include: {
            user: { select: { idUser: true, nameTag: true } },
          },
        },
        user: { select: { idUser: true, nameTag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({ where: { idComment: id } });
    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
  }
};

// Supprimer une analyse
exports.deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.analysis.delete({ where: { idAnalysis: id } });
    res.json({ success: true, message: 'Analyse supprimée' });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Analyse non trouvée' });
  }
};

// Avertir un utilisateur
exports.warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { idUser: id } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Utilisateur non trouvé' });
    if (user.isBanned)
      return res
        .status(400)
        .json({ success: false, message: 'Utilisateur déjà banni' });
    const warnings = user.warnings + 1;
    let isBanned = user.isBanned;
    let banReason = user.banReason;
    if (warnings >= 3) {
      isBanned = true;
      banReason = 'Banni automatiquement après 3 avertissements';
    }
    await prisma.user.update({
      where: { idUser: id },
      data: { warnings, isBanned, banReason },
    });
    res.json({
      success: true,
      message: isBanned
        ? 'Utilisateur banni après 3 avertissements'
        : 'Avertissement ajouté',
      warnings,
      isBanned,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Bannir un utilisateur
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = await prisma.user.findUnique({ where: { idUser: id } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'Utilisateur non trouvé' });
    if (user.isBanned)
      return res
        .status(400)
        .json({ success: false, message: 'Utilisateur déjà banni' });
    await prisma.user.update({
      where: { idUser: id },
      data: {
        isBanned: true,
        banReason: reason || 'Banni par un administrateur',
      },
    });
    res.json({ success: true, message: 'Utilisateur banni' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { idUser: id } });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
  }
};

// Ajouter le rôle analyste à un utilisateur
exports.addAnalystRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { idUser: id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà analyste
    if (user.isAnalyste) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur est déjà analyste",
      });
    }

    // Ajouter le rôle analyste
    const updatedUser = await prisma.user.update({
      where: { idUser: id },
      data: { isAnalyste: true },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        isAdmin: true,
        isAnalyste: true,
        warnings: true,
        isBanned: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Rôle analyste ajouté avec succès',
      data: updatedUser,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du rôle analyste:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'ajout du rôle analyste",
    });
  }
};

// Retirer le rôle analyste d'un utilisateur
exports.removeAnalystRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { idUser: id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que l'utilisateur est analyste
    if (!user.isAnalyste) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur n'est pas analyste",
      });
    }

    // Retirer le rôle analyste
    const updatedUser = await prisma.user.update({
      where: { idUser: id },
      data: { isAnalyste: false },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        isAdmin: true,
        isAnalyste: true,
        warnings: true,
        isBanned: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Rôle analyste retiré avec succès',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Erreur lors du retrait du rôle analyste:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du retrait du rôle analyste',
    });
  }
};

// Lister tous les analystes
exports.getAnalysts = async (req, res) => {
  try {
    const analysts = await prisma.user.findMany({
      where: { isAnalyste: true },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        isAdmin: true,
        isAnalyste: true,
        warnings: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            analyses: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Liste des analystes récupérée avec succès',
      data: analysts,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des analystes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des analystes',
    });
  }
};
