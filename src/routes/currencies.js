const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { authenticateToken } = require('../middleware/auth');

// TODO: Implémenter les routes de devises
// GET /api/v1/currencies - Récupérer toutes les devises
// GET /api/v1/currencies/:id - Récupérer une devise par ID
// POST /api/v1/currencies - Créer une nouvelle devise
// PUT /api/v1/currencies/:id - Mettre à jour une devise
// DELETE /api/v1/currencies/:id - Supprimer une devise

router.get('/', currencyController.getAllCurrencies);

router.get('/:id', currencyController.getCurrencyById);

router.post('/', authenticateToken, currencyController.createCurrency);

router.put('/:id', authenticateToken, currencyController.updateCurrency);

router.delete('/:id', authenticateToken, currencyController.deleteCurrency);

module.exports = router;
