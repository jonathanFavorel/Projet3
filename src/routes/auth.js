const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes d'authentification
// POST /api/v1/auth/register - Inscription
// POST /api/v1/auth/login - Connexion
// POST /api/v1/auth/logout - Déconnexion
// POST /api/v1/auth/refresh - Rafraîchir le token
// GET /api/v1/auth/me - Récupérer les infos de l'utilisateur connecté

router.post('/register', (req, res) => {
  res.json({ message: 'Route d\'inscription - À implémenter' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Route de connexion - À implémenter' });
});

module.exports = router; 