const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/v1/reports - Créer un signalement
router.post('/', authenticateToken, reportController.createReport);

// GET /api/v1/reports - Récupérer tous les signalements (admin)
router.get('/', authenticateToken, reportController.getAllReports);

// GET /api/v1/reports/:id - Récupérer un signalement par ID
router.get('/:id', authenticateToken, reportController.getReportById);

// GET /api/v1/reports/analysis/:analysisId - Récupérer les signalements d'une analyse
router.get(
  '/analysis/:analysisId',
  authenticateToken,
  reportController.getReportsByAnalysis
);

// GET /api/v1/reports/comment/:commentId - Récupérer les signalements d'un commentaire
router.get(
  '/comment/:commentId',
  authenticateToken,
  reportController.getReportsByComment
);

// DELETE /api/v1/reports/:id - Supprimer un signalement
router.delete('/:id', authenticateToken, reportController.deleteReport);

module.exports = router;
