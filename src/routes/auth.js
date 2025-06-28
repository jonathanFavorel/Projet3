const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// TODO: Implémenter les routes d'authentification
// POST /api/v1/auth/register - Inscription
// POST /api/v1/auth/login - Connexion
// POST /api/v1/auth/logout - Déconnexion
// POST /api/v1/auth/refresh - Rafraîchir le token
// GET /api/v1/auth/me - Récupérer les infos de l'utilisateur connecté

// Route d'inscription
router.post('/register', validateRegister, authController.register);

// Route de connexion
router.post('/login', validateLogin, authController.login);

// Route pour récupérer les infos de l'utilisateur connecté
router.get('/me', authenticateToken, authController.getMe);

// Route de déconnexion
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
