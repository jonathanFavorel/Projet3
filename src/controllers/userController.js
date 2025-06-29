const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

/**
 * Contrôleur pour la gestion des utilisateurs
 */
class UserController {
  /**
   * Récupérer tous les utilisateurs (avec pagination)
   * GET /api/v1/users
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Construire les filtres de recherche
      const where = {};
      if (search) {
        where.OR = [
          { nameTag: { contains: search, mode: 'insensitive' } },
          { firstname: { contains: search, mode: 'insensitive' } },
          { lastname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Récupérer les utilisateurs avec pagination
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
            email: true,
            phone: true,
            bio: true,
            createdAt: true,
            lastLogin: true,
            isConnected: true,
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / parseInt(limit));

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer un utilisateur par son ID
   * GET /api/v1/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { idUser: id },
        select: {
          idUser: true,
          nameTag: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          bio: true,
          createdAt: true,
          lastLogin: true,
          isConnected: true,
          tradingAccount: {
            select: {
              idTradingAccount: true,
              leverage: true,
              isPropFirm: true,
              amount: true,
              currency: {
                select: {
                  name: true,
                  symbol: true,
                },
              },
            },
          },
          analyses: {
            select: {
              idAnalysis: true,
              title: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Mettre à jour un utilisateur
   * PUT /api/v1/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nameTag, firstname, lastname, email, phone, bio } = req.body;

      // Validation des données d'entrée
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { idUser: id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      // Vérifier si l'email ou nameTag est déjà utilisé par un autre utilisateur
      if (email || nameTag) {
        const duplicateUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              ...(nameTag ? [{ nameTag }] : []),
            ],
            NOT: { idUser: id },
          },
        });

        if (duplicateUser) {
          return res.status(409).json({
            success: false,
            message:
              "Un utilisateur avec cet email ou ce nom d'utilisateur existe déjà",
          });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {};
      if (nameTag) updateData.nameTag = nameTag;
      if (firstname) updateData.firstname = firstname;
      if (lastname) updateData.lastname = lastname;
      if (email) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { idUser: id },
        data: updateData,
        select: {
          idUser: true,
          nameTag: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          bio: true,
          createdAt: true,
          lastLogin: true,
          isConnected: true,
        },
      });

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: updatedUser,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Supprimer un utilisateur
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { idUser: id },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      // Supprimer l'utilisateur (les relations seront supprimées en cascade)
      await prisma.user.delete({
        where: { idUser: id },
      });

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Changer le mot de passe d'un utilisateur
   * PATCH /api/v1/users/:id/password
   */
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validation des données d'entrée
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array(),
        });
      }

      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { idUser: id },
        select: { password: true },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
      }

      // Vérifier l'ancien mot de passe
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe actuel incorrect',
        });
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { idUser: id },
        data: { password: hashedNewPassword },
      });

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer les statistiques des utilisateurs
   * GET /api/v1/users/stats
   */
  async getUserStats(req, res) {
    try {
      const [totalUsers, connectedUsers, newUsersThisMonth] = await Promise.all(
        [
          prisma.user.count(),
          prisma.user.count({ where: { isConnected: true } }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1
                ),
              },
            },
          }),
        ]
      );

      res.json({
        success: true,
        data: {
          totalUsers,
          connectedUsers,
          newUsersThisMonth,
          connectionRate:
            totalUsers > 0
              ? ((connectedUsers / totalUsers) * 100).toFixed(2)
              : 0,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
      });
    }
  }
}

module.exports = new UserController();
