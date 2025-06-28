const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Initialisation de Prisma
const prisma = new PrismaClient();

// Configuration de l'application
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite chaque IP à 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
});

// Middleware de sécurité et de performance
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API Trading Backend opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: "Bienvenue sur l'API Trading Backend",
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// Préfixe API
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Routes API (à implémenter)
app.use(`${API_PREFIX}/users`, require('./routes/users'));
app.use(`${API_PREFIX}/auth`, require('./routes/auth'));
app.use(`${API_PREFIX}/analyses`, require('./routes/analyses'));
app.use(`${API_PREFIX}/trades`, require('./routes/trades'));
app.use(`${API_PREFIX}/accounts`, require('./routes/accounts'));
app.use(`${API_PREFIX}/currencies`, require('./routes/currencies'));
app.use(`${API_PREFIX}/prop-firms`, require('./routes/propFirms'));
app.use(`${API_PREFIX}/comments`, require('./routes/comments'));
app.use(`${API_PREFIX}/messages`, require('./routes/messages'));

// Middleware de gestion d'erreurs
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.url} n'existe pas`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: 'Erreur interne du serveur',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Une erreur est survenue',
  });
});

// Fonction de démarrage
async function startServer() {
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    // Démarrage du serveur seulement si pas en mode test
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
        console.log(
          `🔗 API disponible sur: http://localhost:${PORT}${API_PREFIX}`
        );
        console.log(`💚 Health check: http://localhost:${PORT}/health`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrage du serveur seulement si pas en mode test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
