const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes d'analyses
// GET /api/v1/analyses - Récupérer toutes les analyses
// GET /api/v1/analyses/:id - Récupérer une analyse par ID
// POST /api/v1/analyses - Créer une nouvelle analyse
// PUT /api/v1/analyses/:id - Mettre à jour une analyse
// DELETE /api/v1/analyses/:id - Supprimer une analyse

router.get('/', (req, res) => {
  res.json({ message: 'Route analyses - À implémenter' });
});

module.exports = router; 