const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');
const {
  getStats,
  getAllUsers,
  getReportedComments,
  getReportedAnalyses,
  deleteComment,
  deleteAnalysis,
  warnUser,
  banUser,
  deleteUser,
  addAnalystRole,
  removeAnalystRole,
  getAnalysts,
} = require('../controllers/adminController');

// Toutes les routes sont protégées par authenticateToken et isAdmin
router.use(authenticateToken, isAdmin);

// Statistiques globales
router.get('/stats', getStats);

// Listes
router.get('/users', getAllUsers);
router.get('/reported-comments', getReportedComments);
router.get('/reported-analyses', getReportedAnalyses);

// Suppression
router.delete('/comment/:id', deleteComment);
router.delete('/analysis/:id', deleteAnalysis);
router.delete('/user/:id', deleteUser);

// Avertir et bannir
router.post('/user/:id/warn', warnUser);
router.post('/user/:id/ban', banUser);

// Gestion des rôles analyste
router.get('/analysts', getAnalysts);
router.post('/user/:id/analyst', addAnalystRole);
router.delete('/user/:id/analyst', removeAnalystRole);

module.exports = router;
