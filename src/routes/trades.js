const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const tradeController = require('../controllers/tradeController');

// TODO: Implémenter les routes de trades
// GET /api/v1/trades - Récupérer tous les trades
// GET /api/v1/trades/:id - Récupérer un trade par ID
// POST /api/v1/trades - Créer un nouveau trade
// PUT /api/v1/trades/:id - Mettre à jour un trade
// DELETE /api/v1/trades/:id - Supprimer un trade

// GET /api/v1/trades - Récupérer tous les trades (authentifié)
router.get('/', authenticateToken, tradeController.getAllTrades);
// GET /api/v1/trades/:id - Récupérer un trade par ID
router.get('/:id', authenticateToken, tradeController.getTradeById);
// POST /api/v1/trades - Créer un nouveau trade
router.post('/', authenticateToken, tradeController.createTrade);
// PUT /api/v1/trades/:id - Mettre à jour un trade
router.put('/:id', authenticateToken, tradeController.updateTrade);
// DELETE /api/v1/trades/:id - Supprimer un trade
router.delete('/:id', authenticateToken, tradeController.deleteTrade);

module.exports = router;
