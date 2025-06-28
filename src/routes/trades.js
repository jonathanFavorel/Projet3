const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes de trades
// GET /api/v1/trades - Récupérer tous les trades
// GET /api/v1/trades/:id - Récupérer un trade par ID
// POST /api/v1/trades - Créer un nouveau trade
// PUT /api/v1/trades/:id - Mettre à jour un trade
// DELETE /api/v1/trades/:id - Supprimer un trade

router.get('/', (req, res) => {
  res.json({ message: 'Route trades - À implémenter' });
});

module.exports = router; 