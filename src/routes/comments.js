const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/v1/comments/analysis/:analysisId - Récupérer tous les commentaires d'une analyse
router.get('/analysis/:analysisId', commentController.getCommentsByAnalysis);

// GET /api/v1/comments/:id - Récupérer un commentaire par ID
router.get('/:id', commentController.getCommentById);

// POST /api/v1/comments - Créer un nouveau commentaire
router.post('/', authenticateToken, commentController.createComment);

// PUT /api/v1/comments/:id - Mettre à jour un commentaire
router.put('/:id', authenticateToken, commentController.updateComment);

// DELETE /api/v1/comments/:id - Supprimer un commentaire
router.delete('/:id', authenticateToken, commentController.deleteComment);

module.exports = router;
