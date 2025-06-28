const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes de devises
// GET /api/v1/currencies - Récupérer toutes les devises
// GET /api/v1/currencies/:id - Récupérer une devise par ID
// POST /api/v1/currencies - Créer une nouvelle devise
// PUT /api/v1/currencies/:id - Mettre à jour une devise
// DELETE /api/v1/currencies/:id - Supprimer une devise

router.get('/', (req, res) => {
  res.json({ message: 'Route devises - À implémenter' });
});

module.exports = router; 