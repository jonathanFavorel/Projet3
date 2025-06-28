const { body } = require('express-validator');

// Validation pour l'inscription
const validateRegister = [
  body('nameTag')
    .trim()
    .isLength({ min: 3, max: 75 })
    .withMessage("Le nom d'utilisateur doit contenir entre 3 et 75 caractères")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores"
    ),

  body('firstname')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le prénom doit contenir entre 2 et 100 caractères')
    .isAlpha('fr-FR', { ignore: ' -' })
    .withMessage('Le prénom ne peut contenir que des lettres'),

  body('lastname')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .isAlpha('fr-FR', { ignore: ' -' })
    .withMessage('Le nom ne peut contenir que des lettres'),

  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,20}$/)
    .withMessage('Numéro de téléphone invalide'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    ),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères'),
];

// Validation pour la connexion
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),

  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

module.exports = {
  validateRegister,
  validateLogin,
};
