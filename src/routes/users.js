const express = require('express');
const router = express.Router();

// TODO: Implémenter les routes utilisateurs
// GET /api/v1/users - Récupérer tous les utilisateurs
// GET /api/v1/users/:id - Récupérer un utilisateur par ID
// POST /api/v1/users - Créer un nouvel utilisateur
// PUT /api/v1/users/:id - Mettre à jour un utilisateur
// DELETE /api/v1/users/:id - Supprimer un utilisateur

router.get('/', (req, res) => {
  res.json({ message: 'Route utilisateurs - À implémenter' });
});

module.exports = router; 