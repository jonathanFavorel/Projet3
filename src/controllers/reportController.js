const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un signalement
exports.createReport = async (req, res) => {
  try {
    const { content, idAnalysis, idComment } = req.body;
    const idUser = req.user.userId;

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: 'Contenu du signalement requis' });
    }

    // Vérifier qu'au moins une analyse ou un commentaire est spécifié
    if (!idAnalysis && !idComment) {
      return res.status(400).json({
        success: false,
        message:
          'Vous devez spécifier une analyse ou un commentaire à signaler',
      });
    }

    // Vérifier qu'une seule cible est spécifiée
    if (idAnalysis && idComment) {
      return res.status(400).json({
        success: false,
        message:
          "Vous ne pouvez signaler qu'une analyse OU un commentaire à la fois",
      });
    }

    // Vérifier que l'analyse existe si spécifiée
    if (idAnalysis) {
      const analysis = await prisma.analysis.findUnique({
        where: { idAnalysis },
      });

      if (!analysis) {
        return res
          .status(404)
          .json({ success: false, message: 'Analyse non trouvée' });
      }

      // Empêcher de signaler sa propre analyse
      if (analysis.idUser === idUser) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas signaler votre propre analyse',
        });
      }
    }

    // Vérifier que le commentaire existe si spécifié
    if (idComment) {
      const comment = await prisma.comment.findUnique({
        where: { idComment },
      });

      if (!comment) {
        return res
          .status(404)
          .json({ success: false, message: 'Commentaire non trouvé' });
      }

      // Empêcher de signaler son propre commentaire
      if (comment.idUser === idUser) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas signaler votre propre commentaire',
        });
      }
    }

    // Vérifier si l'utilisateur a déjà signalé ce contenu
    const existingReport = await prisma.report.findFirst({
      where: {
        idUser,
        ...(idAnalysis && { idAnalysis }),
        ...(idComment && { idComment }),
      },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà signalé ce contenu',
      });
    }

    const report = await prisma.report.create({
      data: {
        content,
        idUser,
        ...(idAnalysis && { idAnalysis }),
        ...(idComment && { idComment }),
      },
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
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
        comment: {
          select: {
            idComment: true,
            content: true,
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Signalement créé avec succès',
      data: report,
    });
  } catch (error) {
    console.error('Erreur création signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer tous les signalements (admin seulement)
exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
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
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
        comment: {
          select: {
            idComment: true,
            content: true,
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Erreur récupération signalements:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer un signalement par ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { idReport: id },
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
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
        comment: {
          select: {
            idComment: true,
            content: true,
            user: {
              select: {
                nameTag: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: 'Signalement non trouvé' });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Erreur récupération signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer les signalements d'une analyse
exports.getReportsByAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;

    // Vérifier que l'analyse existe
    const analysis = await prisma.analysis.findUnique({
      where: { idAnalysis: analysisId },
    });

    if (!analysis) {
      return res
        .status(404)
        .json({ success: false, message: 'Analyse non trouvée' });
    }

    const reports = await prisma.report.findMany({
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

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Erreur récupération signalements analyse:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Récupérer les signalements d'un commentaire
exports.getReportsByComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Vérifier que le commentaire existe
    const comment = await prisma.comment.findUnique({
      where: { idComment: commentId },
    });

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: 'Commentaire non trouvé' });
    }

    const reports = await prisma.report.findMany({
      where: { idComment: commentId },
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

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Erreur récupération signalements commentaire:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un signalement (admin ou créateur du signalement)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const report = await prisma.report.findUnique({
      where: { idReport: id },
      include: {
        user: true,
      },
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: 'Signalement non trouvé' });
    }

    // Vérifier les autorisations (créateur du signalement ou admin)
    if (report.idUser !== userId) {
      // TODO: Ajouter vérification admin quand le système de rôles sera implémenté
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer ce signalement",
      });
    }

    await prisma.report.delete({
      where: { idReport: id },
    });

    res.json({
      success: true,
      message: 'Signalement supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur suppression signalement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
