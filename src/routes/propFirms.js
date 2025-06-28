const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes de firmes de trading
// GET /api/v1/prop-firms - Récupérer toutes les firmes
// GET /api/v1/prop-firms/:id - Récupérer une firme par ID
// POST /api/v1/prop-firms - Créer une nouvelle firme
// PUT /api/v1/prop-firms/:id - Mettre à jour une firme
// DELETE /api/v1/prop-firms/:id - Supprimer une firme

router.get('/', (req, res) => {
  res.json({ message: 'Route firmes de trading - À implémenter' });
});

module.exports = router; 