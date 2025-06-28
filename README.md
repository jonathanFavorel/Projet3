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
- Postman (pour tester l'API)

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
   cp env.example .env
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
├── docs/
│   ├── Trading_API_Collection.json  # Collection Postman
│   └── README_Postman.md            # Guide Postman
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

## 📚 Documentation API

### Collection Postman

Une collection Postman complète est disponible dans le dossier `docs/` :

1. **Importer la collection**
   - Ouvrir Postman
   - Importer le fichier `docs/Trading_API_Collection.json`

2. **Configurer l'environnement**
   - Créer un environnement "Trading API Local"
   - Ajouter les variables :
     - `base_url`: `http://localhost:3000`
     - `api_prefix`: `/api/v1`
     - `auth_token`: (vide au début)

3. **Guide d'utilisation**
   - Consulter `docs/README_Postman.md` pour le guide complet

### Endpoints disponibles

- **🔍 Health Check**: `/health`, `/`
- **🔐 Authentification**: `/api/v1/auth/*`
- **👥 Utilisateurs**: `/api/v1/users/*`
- **📊 Analyses**: `/api/v1/analyses/*`
- **💹 Trades**: `/api/v1/trades/*`
- **💰 Comptes**: `/api/v1/accounts/*`
- **💱 Devises**: `/api/v1/currencies/*`
- **🏢 Firmes**: `/api/v1/prop-firms/*`

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

## 🧪 Tests

### Tests unitaires

```bash
npm test
```

### Tests avec Postman

1. Importer la collection Postman
2. Configurer l'environnement
3. Exécuter les tests dans l'ordre recommandé

## 🤝 Contribution

1. Créer une branche feature : `git flow feature start nom-feature`
2. Développer et commiter vos changements
3. Finaliser la feature : `git flow feature finish nom-feature`
4. Créer une pull request vers `develop`

## 📊 Monitoring

- **API Health**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (admin@trading.com / admin123)
- **Logs Docker**: `docker-compose logs app`

## 🚨 Dépannage

### Erreurs courantes

- **Port 3000 occupé**: Arrêter l'application locale ou utiliser Docker
- **Erreur Prisma**: Vérifier la connexion à la base de données
- **Erreur Docker**: Reconstruire l'image avec `docker-compose up -d --build`

### Solutions

1. Vérifier que Docker est démarré
2. Vérifier les variables d'environnement
3. Consulter les logs : `docker-compose logs app`
4. Redémarrer les services : `docker-compose restart`

## 📄 Licence

Ce projet est sous licence MIT.

## Fonctionnalités principales

- Authentification JWT (utilisateur/admin)
- CRUD Utilisateurs
- Analyses, commentaires, comptes de trading, devises, prop firms
- Système de signalement (analyses, commentaires)
- Dashboard d'administration (statistiques, modération, bannissement, avertissements)
- **Gestion des rôles analyste** (ajout/retrait par un admin)
- **Tests automatisés** (Jest + Supertest, 100% réussite)
- **Documentation Postman** automatisée et à jour

## Gestion des rôles analyste

- `POST /api/v1/admin/user/:id/analyst` : Ajoute le rôle analyste à un utilisateur (admin uniquement)
- `DELETE /api/v1/admin/user/:id/analyst` : Retire le rôle analyste
- `GET /api/v1/admin/analysts` : Liste tous les analystes

## Lancer les tests

```bash
npm test
```

## Documentation Postman

- Collection : `docs/Trading_API_Collection.json`
- Toutes les routes sont à jour et automatisées (variables d'environnement, gestion du token, etc.)

## Lancer le projet

```bash
docker-compose up -d
npm install
npx prisma migrate dev
npm start
```

## Variables d'environnement

Voir `.env.example` pour la configuration.

## Contribution

Workflow Git Flow, PR, tests et documentation obligatoires pour toute feature.
