const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Inscription d'un nouvel utilisateur
const register = async (req, res) => {
  try {
    // Validation des données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { nameTag, firstname, lastname, email, phone, password, bio } =
      req.body;

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà',
      });
    }

    // Vérifier si le nameTag existe déjà
    const existingUserByNameTag = await prisma.user.findUnique({
      where: { nameTag },
    });

    if (existingUserByNameTag) {
      return res.status(409).json({
        success: false,
        message: "Ce nom d'utilisateur est déjà pris",
      });
    }

    // Hashage du mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nameTag,
        firstname,
        lastname,
        email,
        phone,
        password: hashedPassword,
        bio,
        isConnected: false,
      },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        bio: true,
        createdAt: true,
        isConnected: true,
        isAdmin: true,
      },
    });

    // Génération du token JWT
    const token = jwt.sign(
      {
        idUser: newUser.idUser,
        email: newUser.email,
        nameTag: newUser.nameTag,
        isAdmin: newUser.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Connexion d'un utilisateur
const login = async (req, res) => {
  try {
    // Validation des données d'entrée
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        bio: true,
        password: true,
        createdAt: true,
        lastLogin: true,
        isConnected: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect',
      });
    }

    // Mettre à jour la dernière connexion et le statut
    try {
      await prisma.user.update({
        where: { idUser: user.idUser },
        data: {
          lastLogin: new Date(),
          isConnected: true,
        },
      });
    } catch (updateError) {
      // Si l'utilisateur n'existe plus (par exemple après nettoyage de la base de test),
      // on continue sans mettre à jour les champs de connexion
      console.warn(
        'Impossible de mettre à jour les informations de connexion:',
        updateError.message
      );
    }

    // Génération du token JWT
    const token = jwt.sign(
      {
        idUser: user.idUser,
        email: user.email,
        nameTag: user.nameTag,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Retirer le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Récupérer les informations de l'utilisateur connecté
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Token d'accès requis",
      });
    }
    const userId = req.user.idUser;
    const user = await prisma.user.findUnique({
      where: { idUser: userId },
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
        isAdmin: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'utilisateur",
      error: error.message,
    });
  }
};

// Déconnexion
const logout = async (req, res) => {
  try {
    const userId = req.user.idUser;

    // Mettre à jour le statut de connexion
    try {
      await prisma.user.update({
        where: { idUser: userId },
        data: { isConnected: false },
      });
    } catch (updateError) {
      // Si l'utilisateur n'existe plus (par exemple après nettoyage de la base de test),
      // on continue sans mettre à jour le statut de connexion
      console.warn(
        'Impossible de mettre à jour le statut de connexion:',
        updateError.message
      );
    }

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
