const express = require('express');
const router = express.Router();
const propFirmController = require('../controllers/propFirmController');
const { authenticateToken } = require('../middleware/auth');

// TODO: Implémenter les routes de firmes de trading
// GET /api/v1/prop-firms - Récupérer toutes les firmes
// GET /api/v1/prop-firms/:id - Récupérer une firme par ID
// POST /api/v1/prop-firms - Créer une nouvelle firme
// PUT /api/v1/prop-firms/:id - Mettre à jour une firme
// DELETE /api/v1/prop-firms/:id - Supprimer une firme

// GET /api/v1/prop-firms - Récupérer toutes les firmes
router.get('/', propFirmController.getAllPropFirms);

// GET /api/v1/prop-firms/:id - Récupérer une firme par ID
router.get('/:id', propFirmController.getPropFirmById);

// POST /api/v1/prop-firms - Créer une nouvelle firme
router.post('/', authenticateToken, propFirmController.createPropFirm);

// PUT /api/v1/prop-firms/:id - Mettre à jour une firme
router.put('/:id', authenticateToken, propFirmController.updatePropFirm);

// DELETE /api/v1/prop-firms/:id - Supprimer une firme
router.delete('/:id', authenticateToken, propFirmController.deletePropFirm);

module.exports = router;
