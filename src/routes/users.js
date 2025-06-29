const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

/**
 * @route GET /api/v1/users
 * @desc Récupérer tous les utilisateurs avec pagination et recherche
 * @access Private (Admin)
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Le numéro de page doit être un entier positif'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La limite doit être un entier entre 1 et 100'),

    query('search')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('La recherche doit contenir entre 2 et 100 caractères'),
  ],
  validateRequest,
  userController.getAllUsers
);

/**
 * @route GET /api/v1/users/stats
 * @desc Récupérer les statistiques des utilisateurs
 * @access Private (Admin)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route GET /api/v1/users/:id
 * @desc Récupérer un utilisateur par son ID
 * @access Private
 */
router.get(
  '/:id',
  [param('id').isUUID().withMessage('ID utilisateur invalide')],
  validateRequest,
  userController.getUserById
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Mettre à jour un utilisateur
 * @access Private
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('ID utilisateur invalide'),

    body('nameTag')
      .optional()
      .trim()
      .isLength({ min: 3, max: 75 })
      .withMessage(
        "Le nom d'utilisateur doit contenir entre 3 et 75 caractères"
      )
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage(
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
      ),

    body('firstname')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le prénom doit contenir entre 2 et 100 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .withMessage(
        'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'
      ),

    body('lastname')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom doit contenir entre 2 et 100 caractères')
      .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
      .withMessage(
        'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
      ),

    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email invalide'),

    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[0-9\s\-\(\)]{10,20}$/)
      .withMessage('Numéro de téléphone invalide'),

    body('bio')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La bio ne peut pas dépasser 1000 caractères'),
  ],
  validateRequest,
  userController.updateUser
);

/**
 * @route PATCH /api/v1/users/:id/password
 * @desc Changer le mot de passe d'un utilisateur
 * @access Private
 */
router.patch(
  '/:id/password',
  [
    param('id').isUUID().withMessage('ID utilisateur invalide'),

    body('currentPassword')
      .notEmpty()
      .withMessage('Le mot de passe actuel est requis'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage(
        'Le nouveau mot de passe doit contenir au moins 8 caractères'
      )
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
      ),
  ],
  validateRequest,
  userController.changePassword
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Supprimer un utilisateur
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('ID utilisateur invalide')],
  validateRequest,
  userController.deleteUser
);

module.exports = router;
