const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const { content, recipientId } = req.body;
    const senderId = req.user.idUser;

    if (!content || !recipientId) {
      return res
        .status(400)
        .json({ success: false, message: 'Contenu et destinataire requis' });
    }

    // Vérifier que le destinataire existe
    const recipient = await prisma.user.findUnique({
      where: { idUser: recipientId },
    });

    if (!recipient) {
      return res
        .status(404)
        .json({ success: false, message: 'Destinataire non trouvé' });
    }

    // Empêcher l'envoi de message à soi-même
    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'envoyer un message à vous-même",
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        recipientId,
      },
      include: {
        sender: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        recipient: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer les conversations de l'utilisateur
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.idUser;

    // Récupérer toutes les conversations (messages envoyés et reçus)
    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        recipient: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Grouper par conversation (autre utilisateur)
    const conversationMap = new Map();

    conversations.forEach(message => {
      const otherUserId =
        message.senderId === userId ? message.recipientId : message.senderId;
      const otherUser =
        message.senderId === userId ? message.recipient : message.sender;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUser,
          lastMessage: message,
          unreadCount: 0,
        });
      } else {
        const conversation = conversationMap.get(otherUserId);
        if (message.createdAt > conversation.lastMessage.createdAt) {
          conversation.lastMessage = message;
        }
      }

      // Compter les messages non lus
      if (message.recipientId === userId && !message.isRead) {
        conversationMap.get(otherUserId).unreadCount++;
      }
    });

    const conversationsList = Array.from(conversationMap.values());

    res.json({ success: true, data: conversationsList });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer les messages d'une conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.idUser;

    // Vérifier que l'autre utilisateur existe
    const otherUser = await prisma.user.findUnique({
      where: { idUser: otherUserId },
      select: {
        idUser: true,
        nameTag: true,
        firstname: true,
        lastname: true,
      },
    });

    if (!otherUser) {
      return res
        .status(404)
        .json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Récupérer tous les messages entre les deux utilisateurs
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            AND: [{ senderId: userId }, { recipientId: otherUserId }],
          },
          {
            AND: [{ senderId: otherUserId }, { recipientId: userId }],
          },
        ],
      },
      include: {
        sender: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        recipient: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Marquer les messages reçus comme lus
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ success: true, data: { messages, otherUser } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer un message par ID
exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.idUser;

    const message = await prisma.message.findUnique({
      where: { idMessage: id },
      include: {
        sender: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        recipient: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est impliqué dans cette conversation
    if (message.senderId !== userId && message.recipientId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: 'Non autorisé à voir ce message' });
    }

    // Marquer comme lu si l'utilisateur est le destinataire
    if (message.recipientId === userId && !message.isRead) {
      await prisma.message.update({
        where: { idMessage: id },
        data: { isRead: true },
      });
      message.isRead = true;
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.idUser;

    // Vérifier que l'utilisateur est l'expéditeur du message
    const message = await prisma.message.findUnique({
      where: { idMessage: id },
    });

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: 'Message non trouvé' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce message',
      });
    }

    await prisma.message.delete({ where: { idMessage: id } });
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Message non trouvé' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Marquer un message comme lu
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.idUser;

    const message = await prisma.message.findUnique({
      where: { idMessage: id },
    });

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: 'Message non trouvé' });
    }

    if (message.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à marquer ce message comme lu',
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { idMessage: id },
      data: { isRead: true },
      include: {
        sender: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
        recipient: {
          select: {
            idUser: true,
            nameTag: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    if (error.code === 'P2025') {
      return res
        .status(404)
        .json({ success: false, message: 'Message non trouvé' });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};

// Récupérer le nombre de messages non lus
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.idUser;

    const unreadCount = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  }
};
