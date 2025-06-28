const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticateToken } = require('../middleware/auth');
// const { validateAnalysis } = require('../middleware/validation'); // À créer si besoin

// TODO: Implémenter les routes d'analyses
// GET /api/v1/analyses - Récupérer toutes les analyses
// GET /api/v1/analyses/:id - Récupérer une analyse par ID
// POST /api/v1/analyses - Créer une nouvelle analyse
// PUT /api/v1/analyses/:id - Mettre à jour une analyse
// DELETE /api/v1/analyses/:id - Supprimer une analyse

// GET /api/v1/analyses - Récupérer toutes les analyses
router.get('/', analysisController.getAllAnalyses);

// GET /api/v1/analyses/:id - Récupérer une analyse par ID
router.get('/:id', analysisController.getAnalysisById);

// POST /api/v1/analyses - Créer une nouvelle analyse
router.post('/', authenticateToken, analysisController.createAnalysis);

// PUT /api/v1/analyses/:id - Mettre à jour une analyse
router.put('/:id', authenticateToken, analysisController.updateAnalysis);

// DELETE /api/v1/analyses/:id - Supprimer une analyse
router.delete('/:id', authenticateToken, analysisController.deleteAnalysis);

module.exports = router;
