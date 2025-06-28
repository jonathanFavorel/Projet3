const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Toutes les routes sont protégées par authenticateToken et isAdmin
router.use(authenticateToken, isAdmin);

// Statistiques globales
router.get('/stats', adminController.getStats);

// Listes
router.get('/users', adminController.getUsers);
router.get('/reported-comments', adminController.getReportedComments);
router.get('/reported-analyses', adminController.getReportedAnalyses);

// Suppression
router.delete('/comment/:id', adminController.deleteComment);
router.delete('/analysis/:id', adminController.deleteAnalysis);
router.delete('/user/:id', adminController.deleteUser);

// Avertir et bannir
router.post('/user/:id/warn', adminController.warnUser);
router.post('/user/:id/ban', adminController.banUser);

module.exports = router;
