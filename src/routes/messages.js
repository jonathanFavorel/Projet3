const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/v1/messages - Envoyer un message
router.post('/', authenticateToken, messageController.sendMessage);

// GET /api/v1/messages/conversations - Récupérer les conversations
router.get(
  '/conversations',
  authenticateToken,
  messageController.getConversations
);

// GET /api/v1/messages/conversation/:otherUserId - Récupérer les messages d'une conversation
router.get(
  '/conversation/:otherUserId',
  authenticateToken,
  messageController.getConversationMessages
);

// GET /api/v1/messages/:id - Récupérer un message par ID
router.get('/:id', authenticateToken, messageController.getMessageById);

// DELETE /api/v1/messages/:id - Supprimer un message
router.delete('/:id', authenticateToken, messageController.deleteMessage);

// PATCH /api/v1/messages/:id/read - Marquer un message comme lu
router.patch('/:id/read', authenticateToken, messageController.markAsRead);

// GET /api/v1/messages/unread/count - Récupérer le nombre de messages non lus
router.get(
  '/unread/count',
  authenticateToken,
  messageController.getUnreadCount
);

module.exports = router;
