# API Trading Backend

Backend API pour une application de trading avec analyse de marchés, gestion de comptes et système de messagerie.

## 🚀 Technologies

- **Node.js** avec **Express.js**
- **PostgreSQL** comme base de données
- **Prisma** comme ORM
- **Docker** pour la containerisation
- **Git Flow** pour la gestion des branches

## 📋 Prérequis

- Docker et Docker Compose
- Node.js (version 18+)
- npm ou yarn

## 🛠️ Installation

1. **Cloner le repository**

   ```bash
   git clone <votre-repo-url>
   cd 3-back
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec vos configurations
   ```

4. **Lancer avec Docker**

   ```bash
   docker-compose up -d
   ```

5. **Exécuter les migrations Prisma**
   ```bash
   npx prisma migrate dev
   ```

## 🏗️ Structure du projet

```
3-back/
├── src/
│   ├── controllers/     # Contrôleurs Express
│   ├── routes/         # Routes API
│   ├── middleware/     # Middleware personnalisés
│   ├── services/       # Logique métier
│   ├── models/         # Modèles Prisma
│   └── utils/          # Utilitaires
├── prisma/
│   ├── schema.prisma   # Schéma de base de données
│   └── migrations/     # Migrations Prisma
├── docker/
│   └── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🗄️ Base de données

Le projet utilise PostgreSQL avec les tables suivantes :

- `_User` - Utilisateurs
- `propFirm` - Firmes de trading
- `currency` - Devises
- `_Analysis` - Analyses de marché
- `tradingAccount` - Comptes de trading
- `trade` - Trades
- `accountStats` - Statistiques de comptes
- `message` - Messages
- `role` - Rôles utilisateurs

## 🔄 Git Flow

Ce projet suit la convention Git Flow :

- `master` - Code en production
- `develop` - Branche de développement
- `feature/*` - Nouvelles fonctionnalités
- `bugfix/*` - Corrections de bugs
- `release/*` - Préparation des releases
- `hotfix/*` - Corrections urgentes

## 📝 Scripts disponibles

- `npm run dev` - Démarrage en mode développement
- `npm run build` - Build de production
- `npm run start` - Démarrage en production
- `npm run test` - Exécution des tests
- `npm run db:migrate` - Exécution des migrations
- `npm run db:generate` - Génération du client Prisma

## 🤝 Contribution

1. Créer une branche feature : `git flow feature start nom-feature`
2. Développer et commiter vos changements
3. Finaliser la feature : `git flow feature finish nom-feature`
4. Créer une pull request vers `develop`

## 📄 Licence

Ce projet est sous licence MIT.
