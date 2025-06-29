const express = require('express');
const router = express.Router();
const tradingAccountController = require('../controllers/tradingAccountController');
const { authenticateToken } = require('../middleware/auth');
const accountStatsController = require('../controllers/accountStatsController');
// const { validateAccount } = require('../middleware/validation'); // À créer si besoin

// TODO: Implémenter les routes de comptes de trading
// GET /api/v1/accounts - Récupérer tous les comptes
// GET /api/v1/accounts/:id - Récupérer un compte par ID
// POST /api/v1/accounts - Créer un nouveau compte
// PUT /api/v1/accounts/:id - Mettre à jour un compte
// DELETE /api/v1/accounts/:id - Supprimer un compte
// GET /api/v1/accounts/:id/stats - Récupérer les stats d'un compte

// GET /api/v1/accounts - Récupérer tous les comptes
router.get('/', tradingAccountController.getAllAccounts);

// GET /api/v1/accounts/:id/stats - Récupérer les stats d'un compte (AVANT /:id)
router.get(
  '/:id/stats',
  authenticateToken,
  accountStatsController.getAccountStats
);

// GET /api/v1/accounts/:id - Récupérer un compte par ID
router.get('/:id', tradingAccountController.getAccountById);

// POST /api/v1/accounts - Créer un nouveau compte
router.post('/', authenticateToken, tradingAccountController.createAccount);

// PUT /api/v1/accounts/:id - Mettre à jour un compte
router.put('/:id', authenticateToken, tradingAccountController.updateAccount);

// DELETE /api/v1/accounts/:id - Supprimer un compte
router.delete(
  '/:id',
  authenticateToken,
  tradingAccountController.deleteAccount
);

module.exports = router;
