const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes de comptes de trading
// GET /api/v1/accounts - Récupérer tous les comptes
// GET /api/v1/accounts/:id - Récupérer un compte par ID
// POST /api/v1/accounts - Créer un nouveau compte
// PUT /api/v1/accounts/:id - Mettre à jour un compte
// DELETE /api/v1/accounts/:id - Supprimer un compte
// GET /api/v1/accounts/:id/stats - Récupérer les stats d'un compte

router.get('/', (req, res) => {
  res.json({ message: 'Route comptes de trading - À implémenter' });
});

module.exports = router; 