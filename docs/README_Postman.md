# Guide d'utilisation Postman - Trading API Backend

Ce guide explique comment utiliser la collection Postman pour tester l'API Trading Backend.

## 📋 Table des matières

1. [Installation et configuration](#installation-et-configuration)
2. [Variables d'environnement](#variables-denvironnement)
3. [Authentification automatique](#authentification-automatique)
4. [Endpoints disponibles](#endpoints-disponibles)
5. [Exemples d'utilisation](#exemples-dutilisation)
6. [Dépannage](#dépannage)

## 🚀 Installation et configuration

### 1. Importer la collection

1. Ouvrez Postman
2. Cliquez sur "Import" dans la barre d'outils
3. Sélectionnez le fichier `Trading_API_Collection.json`
4. La collection sera importée avec tous les endpoints organisés par catégories

### 2. Configuration initiale

Après l'import, vous devez configurer les variables d'environnement pour que l'API fonctionne correctement.

## 🔧 Variables d'environnement

La collection utilise les variables suivantes :

| Variable     | Description                  | Valeur par défaut       |
| ------------ | ---------------------------- | ----------------------- |
| `base_url`   | URL de base de l'API         | `http://localhost:3000` |
| `api_prefix` | Préfixe de l'API             | `/api/v1`               |
| `auth_token` | Token d'authentification JWT | (vide)                  |

### Configuration des variables

1. Ouvrez la collection dans Postman
2. Cliquez sur l'onglet "Variables"
3. Configurez les valeurs selon votre environnement :

```json
{
  "base_url": "http://localhost:3000",
  "api_prefix": "/api/v1",
  "auth_token": ""
}
```

## 🔐 Authentification automatique

La collection inclut une gestion automatique du token d'authentification :

### Script de connexion automatique

La requête "Connexion" contient un script qui récupère automatiquement le token :

```javascript
// Récupérer le token d'authentification
if (pm.response.code === 200) {
  const responseJson = pm.response.json();
  if (responseJson.data && responseJson.data.token) {
    pm.collectionVariables.set('auth_token', responseJson.data.token);
    console.log("Token d'authentification récupéré et stocké");
  }
}
```

### Script de déconnexion automatique

La requête "Déconnexion" supprime automatiquement le token :

```javascript
// Supprimer le token d'authentification
pm.collectionVariables.set('auth_token', '');
console.log("Token d'authentification supprimé");
```

### Workflow d'authentification

1. **Inscription** : Créez un compte utilisateur
2. **Connexion** : Connectez-vous (le token est automatiquement récupéré)
3. **Utilisation** : Toutes les requêtes protégées utilisent automatiquement le token
4. **Déconnexion** : Déconnectez-vous (le token est automatiquement supprimé)

## 📡 Endpoints disponibles

### 🔍 Health Check

- `GET /health` - Vérifier le statut de santé de l'API
- `GET /` - Informations générales de l'API

### 🔐 Authentification

- `POST /api/v1/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/v1/auth/login` - Connexion (avec récupération automatique du token)
- `GET /api/v1/auth/me` - Profil de l'utilisateur connecté
- `POST /api/v1/auth/logout` - Déconnexion (avec suppression automatique du token)

### 👥 Utilisateurs (CRUD complet)

#### Création et gestion

- `POST /api/v1/users` - Créer un nouvel utilisateur (Admin uniquement)
- `GET /api/v1/users` - Liste des utilisateurs avec pagination
- `GET /api/v1/users?search=john` - Rechercher des utilisateurs
- `GET /api/v1/users/stats` - Statistiques des utilisateurs (Admin uniquement)

#### Gestion individuelle

- `GET /api/v1/users/:id` - Récupérer un utilisateur par ID
- `PUT /api/v1/users/:id` - Mettre à jour un utilisateur
- `PATCH /api/v1/users/:id/password` - Changer le mot de passe
- `DELETE /api/v1/users/:id` - Supprimer un utilisateur (Admin uniquement)

### 📊 Analyses

- `GET /api/v1/analyses` - Liste des analyses
- `POST /api/v1/analyses` - Créer une analyse
- `GET /api/v1/analyses/:id` - Récupérer une analyse par ID
- `PUT /api/v1/analyses/:id` - Mettre à jour une analyse
- `DELETE /api/v1/analyses/:id` - Supprimer une analyse

### 💰 Trades

- `GET /api/v1/trades` - Liste des trades
- `POST /api/v1/trades` - Créer un trade
- `GET /api/v1/trades/:id` - Récupérer un trade par ID
- `PUT /api/v1/trades/:id` - Mettre à jour un trade
- `DELETE /api/v1/trades/:id` - Supprimer un trade

### 🏦 Comptes Trading

- `GET /api/v1/accounts` - Liste des comptes trading
- `POST /api/v1/accounts` - Créer un compte trading
- `GET /api/v1/accounts/:id` - Récupérer un compte par ID
- `PUT /api/v1/accounts/:id` - Mettre à jour un compte
- `DELETE /api/v1/accounts/:id` - Supprimer un compte

### 💱 Devises

- `GET /api/v1/currencies` - Liste des devises
- `POST /api/v1/currencies` - Créer une devise
- `GET /api/v1/currencies/:id` - Récupérer une devise par ID
- `PUT /api/v1/currencies/:id` - Mettre à jour une devise
- `DELETE /api/v1/currencies/:id` - Supprimer une devise

### 🏢 Prop Firms

- `GET /api/v1/prop-firms` - Liste des prop firms
- `POST /api/v1/prop-firms` - Créer une prop firm
- `GET /api/v1/prop-firms/:id` - Récupérer une prop firm par ID
- `PUT /api/v1/prop-firms/:id` - Mettre à jour une prop firm
- `DELETE /api/v1/prop-firms/:id` - Supprimer une prop firm

## 💡 Exemples d'utilisation

### 1. Workflow complet d'authentification

```bash
# 1. Inscription
POST {{base_url}}{{api_prefix}}/auth/register
{
  "nameTag": "trader123",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "MotDePasse123!",
  "phone": "+33123456789",
  "bio": "Trader passionné"
}

# 2. Connexion (token récupéré automatiquement)
POST {{base_url}}{{api_prefix}}/auth/login
{
  "email": "john.doe@example.com",
  "password": "MotDePasse123!"
}

# 3. Utilisation des endpoints protégés
GET {{base_url}}{{api_prefix}}/auth/me
# Le token est automatiquement inclus dans l'en-tête Authorization

# 4. Déconnexion (token supprimé automatiquement)
POST {{base_url}}{{api_prefix}}/auth/logout
```

### 2. Gestion des utilisateurs

```bash
# Créer un utilisateur (Admin)
POST {{base_url}}{{api_prefix}}/users
{
  "nameTag": "newtrader",
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "phone": "+33987654321",
  "bio": "Nouvelle trader passionnée"
}

# Lister les utilisateurs avec pagination
GET {{base_url}}{{api_prefix}}/users?page=1&limit=10

# Rechercher des utilisateurs
GET {{base_url}}{{api_prefix}}/users?search=john

# Obtenir les statistiques
GET {{base_url}}{{api_prefix}}/users/stats

# Récupérer un utilisateur par ID
GET {{base_url}}{{api_prefix}}/users/{{user_id}}

# Mettre à jour un utilisateur
PUT {{base_url}}{{api_prefix}}/users/{{user_id}}
{
  "firstname": "John Updated",
  "lastname": "Doe Updated",
  "bio": "Bio mise à jour"
}

# Changer le mot de passe
PATCH {{base_url}}{{api_prefix}}/users/{{user_id}}/password
{
  "currentPassword": "MotDePasse123!",
  "newPassword": "NouveauMotDePasse456!"
}

# Supprimer un utilisateur (Admin)
DELETE {{base_url}}{{api_prefix}}/users/{{user_id}}
```

### 3. Gestion des analyses

```bash
# Créer une analyse
POST {{base_url}}{{api_prefix}}/analyses
{
  "title": "Analyse EUR/USD",
  "content": "Analyse technique détaillée de la paire EUR/USD..."
}

# Lister les analyses
GET {{base_url}}{{api_prefix}}/analyses

# Récupérer une analyse par ID
GET {{base_url}}{{api_prefix}}/analyses/{{analysis_id}}

# Mettre à jour une analyse
PUT {{base_url}}{{api_prefix}}/analyses/{{analysis_id}}
{
  "title": "Analyse EUR/USD Mise à Jour",
  "content": "Contenu mis à jour..."
}

# Supprimer une analyse
DELETE {{base_url}}{{api_prefix}}/analyses/{{analysis_id}}
```

### 4. Gestion des trades

```bash
# Créer un trade
POST {{base_url}}{{api_prefix}}/trades
{
  "entryPrice": 1.0850,
  "exitPrice": 1.0900,
  "takeProfit": 1.0950,
  "quantity": 1.0,
  "status": "closed",
  "dateEntry": "2024-01-15T10:00:00Z",
  "dateExit": "2024-01-15T15:00:00Z",
  "idTradingAccount": "{{account_id}}",
  "idCurrency": "{{currency_id}}"
}

# Lister les trades
GET {{base_url}}{{api_prefix}}/trades

# Mettre à jour un trade
PUT {{base_url}}{{api_prefix}}/trades/{{trade_id}}
{
  "exitPrice": 1.0920,
  "status": "closed",
  "dateExit": "2024-01-15T16:00:00Z"
}
```

## 🔍 Validation et sécurité

### Validation des données

L'API inclut une validation complète des données :

- **Nom d'utilisateur** : 3-75 caractères, lettres, chiffres, tirets et underscores
- **Prénom/Nom** : 2-100 caractères, lettres, espaces, tirets et apostrophes
- **Email** : Format email valide
- **Téléphone** : Format international (+33123456789)
- **Mot de passe** : Minimum 8 caractères, incluant minuscule, majuscule, chiffre et caractère spécial
- **Bio** : Maximum 1000 caractères

### Codes de réponse

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | Succès                           |
| 201  | Créé avec succès                 |
| 400  | Données invalides                |
| 401  | Non authentifié                  |
| 404  | Ressource non trouvée            |
| 409  | Conflit (ex: email déjà utilisé) |
| 500  | Erreur serveur                   |

## 🛠️ Dépannage

### Problèmes courants

#### 1. Erreur 404 - Route non trouvée

- Vérifiez que l'API est démarrée
- Vérifiez les variables `base_url` et `api_prefix`
- Assurez-vous que l'URL est correcte

#### 2. Erreur 401 - Non authentifié

- Vérifiez que vous êtes connecté
- Vérifiez que le token est présent dans les variables
- Reconnectez-vous si nécessaire

#### 3. Erreur 400 - Données invalides

- Vérifiez le format des données envoyées
- Consultez les messages d'erreur dans la réponse
- Respectez les règles de validation

#### 4. Token expiré

- Reconnectez-vous pour obtenir un nouveau token
- Le token expire après 1 heure par défaut

### Vérification de l'API

Avant de tester les endpoints, vérifiez que l'API fonctionne :

```bash
GET {{base_url}}/health
```

Réponse attendue :

```json
{
  "status": "OK",
  "message": "API Trading Backend opérationnelle",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "environment": "development"
}
```

## 📝 Notes importantes

1. **Authentification** : La plupart des endpoints nécessitent une authentification
2. **Permissions** : Certains endpoints sont réservés aux administrateurs
3. **Validation** : Toutes les données sont validées côté serveur
4. **Sécurité** : Les mots de passe sont hashés et ne sont jamais exposés
5. **Pagination** : Les listes utilisent la pagination pour de meilleures performances

## 🔄 Mise à jour de la collection

Pour mettre à jour la collection :

1. Sauvegardez vos variables d'environnement
2. Supprimez l'ancienne collection
3. Importez la nouvelle version
4. Restaurez vos variables d'environnement

---

**Support** : Pour toute question ou problème, consultez la documentation de l'API ou contactez l'équipe de développement.

## Endpoints Analyses

### GET {{base_url}}{{api_prefix}}/analyses

- **Description** : Récupère toutes les analyses.
- **Réponse succès** :

```json
{
  "success": true,
  "data": [
    {
      "idAnalysis": "uuid",
      "title": "Analyse 1",
      "content": "...",
      "createdAt": "2024-06-28T...",
      "user": { "idUser": "...", "nameTag": "..." },
      ...
    }
  ]
}
```

### GET {{base_url}}{{api_prefix}}/analyses/:id

- **Description** : Récupère une analyse par son ID (UUID).
- **Paramètre** : `id` (string, requis)
- **Réponse succès** :

```json
{
  "success": true,
  "data": {
    "idAnalysis": "uuid",
    "title": "...",
    "content": "...",
    "createdAt": "...",
    "user": { "idUser": "...", "nameTag": "..." },
    ...
  }
}
```

- **Réponse erreur** :

```json
{
  "success": false,
  "message": "Analyse non trouvée"
}
```

### POST {{base_url}}{{api_prefix}}/analyses

- **Description** : Crée une nouvelle analyse (authentification requise).
- **Body** :

```json
{
  "title": "Titre analyse",
  "content": "Contenu",
  "idUser": "uuid-user"
}
```

- **Réponse succès** :

```json
{
  "success": true,
  "data": { ... }
}
```

### PUT {{base_url}}{{api_prefix}}/analyses/:id

- **Description** : Met à jour une analyse (authentification requise).
- **Body** :

```json
{
  "title": "Nouveau titre",
  "content": "Nouveau contenu"
}
```

- **Réponse succès** :

```json
{
  "success": true,
  "data": { ... }
}
```

### DELETE {{base_url}}{{api_prefix}}/analyses/:id

- **Description** : Supprime une analyse (authentification requise).
- **Réponse succès** :

```json
{
  "success": true,
  "message": "Analyse supprimée"
}
```

---

**Variables d'environnement à utiliser dans Postman :**

- `base_url` : ex. http://localhost:3000
- `api_prefix` : ex. /api/v1
- `auth_token` : token JWT (récupéré à la connexion)

**Bonnes pratiques :**

- Utiliser le script de récupération du token dans la requête login (onglet Tests)
- Utiliser la variable `{{auth_token}}` en Bearer Token pour les requêtes protégées
- Ajouter des exemples de réponses dans Postman pour chaque endpoint

# Documentation API Trading Backend - Postman

## 📋 Table des matières

- [Configuration](#configuration)
- [Authentification](#authentification)
- [Utilisateurs](#utilisateurs)
- [Analyses](#analyses)
- [Trades](#trades)
- [Comptes de Trading](#comptes-de-trading)
- [Devises](#devises)
- [Prop Firms](#prop-firms)
- [Commentaires](#commentaires)
- [Messages](#messages)
- [Signalements](#signalements)

## ⚙️ Configuration

### Variables d'environnement

- `base_url`: URL de base de l'API (ex: http://localhost:3000)
- `api_prefix`: Préfixe de l'API (ex: /api/v1)
- `auth_token`: Token d'authentification (géré automatiquement)

### Import de la collection

1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner le fichier `Trading_API_Collection.json`
4. La collection sera importée avec toutes les requêtes préconfigurées

## 🔐 Authentification

### Inscription

- **POST** `/api/v1/auth/register`
- **Body**: `{ "nameTag", "firstname", "lastname", "email", "password" }`
- **Description**: Créer un nouveau compte utilisateur

### Connexion

- **POST** `/api/v1/auth/login`
- **Body**: `{ "email", "password" }`
- **Description**: Se connecter et obtenir un token JWT

### Déconnexion

- **POST** `/api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Se déconnecter et invalider le token

### Profil utilisateur

- **GET** `/api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer les informations du profil connecté

## 👥 Utilisateurs

### Liste des utilisateurs

- **GET** `/api/v1/users`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`, `search`
- **Description**: Récupérer la liste des utilisateurs avec pagination

### Utilisateur par ID

- **GET** `/api/v1/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer un utilisateur spécifique

### Créer utilisateur

- **POST** `/api/v1/users`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "nameTag", "firstname", "lastname", "email", "password", "phone", "bio" }`
- **Description**: Créer un nouvel utilisateur (admin uniquement)

### Mettre à jour utilisateur

- **PUT** `/api/v1/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "firstname", "lastname", "phone", "bio" }`
- **Description**: Mettre à jour un utilisateur

### Changer mot de passe

- **PATCH** `/api/v1/users/:id/password`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "currentPassword", "newPassword" }`
- **Description**: Changer le mot de passe d'un utilisateur

### Supprimer utilisateur

- **DELETE** `/api/v1/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer un utilisateur

### Statistiques utilisateurs

- **GET** `/api/v1/users/stats`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer les statistiques des utilisateurs

### Gestion des Rôles Analyste

- **GET** `/api/v1/admin/analysts` - Liste de tous les analystes
  - Inclut les statistiques de publications et commentaires
  - Accès admin uniquement
- **POST** `/api/v1/admin/user/:id/analyst` - Ajouter le rôle analyste
  - Permet à l'utilisateur de créer des analyses
  - Vérification que l'utilisateur n'est pas déjà analyste
- **DELETE** `/api/v1/admin/user/:id/analyst` - Retirer le rôle analyste
  - Retire les privilèges de création d'analyses
  - Vérification que l'utilisateur est analyste

## 📊 Analyses

### Liste des analyses

- **GET** `/api/v1/analyses`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`
- **Description**: Récupérer la liste des analyses

### Analyse par ID

- **GET** `/api/v1/analyses/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer une analyse spécifique

### Créer analyse

- **POST** `/api/v1/analyses`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "title", "content" }`
- **Description**: Créer une nouvelle analyse

### Mettre à jour analyse

- **PUT** `/api/v1/analyses/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "title", "content" }`
- **Description**: Mettre à jour une analyse

### Supprimer analyse

- **DELETE** `/api/v1/analyses/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer une analyse

## 💰 Trades

### Liste des trades

- **GET** `/api/v1/trades`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`, `accountId`
- **Description**: Récupérer la liste des trades

### Trade par ID

- **GET** `/api/v1/trades/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer un trade spécifique

### Créer trade

- **POST** `/api/v1/trades`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "entryPrice", "exitPrice", "takeProfit", "quantity", "status", "dateEntry", "dateExit", "idTradingAccount", "idCurrency" }`
- **Description**: Créer un nouveau trade

### Mettre à jour trade

- **PUT** `/api/v1/trades/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "entryPrice", "exitPrice", "takeProfit", "quantity", "status", "dateEntry", "dateExit" }`
- **Description**: Mettre à jour un trade

### Supprimer trade

- **DELETE** `/api/v1/trades/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer un trade

## 🏦 Comptes de Trading

### Liste des comptes

- **GET** `/api/v1/accounts`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`
- **Description**: Récupérer la liste des comptes de trading

### Compte par ID

- **GET** `/api/v1/accounts/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer un compte spécifique

### Créer compte

- **POST** `/api/v1/accounts`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "leverage", "isPropFirm", "amount", "idCurrency", "idPropFirm" }`
- **Description**: Créer un nouveau compte de trading

### Mettre à jour compte

- **PUT** `/api/v1/accounts/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "leverage", "isPropFirm", "amount", "idCurrency", "idPropFirm" }`
- **Description**: Mettre à jour un compte de trading

### Supprimer compte

- **DELETE** `/api/v1/accounts/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer un compte de trading

## 💱 Devises

### Liste des devises

- **GET** `/api/v1/currencies`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`
- **Description**: Récupérer la liste des devises

### Devise par ID

- **GET** `/api/v1/currencies/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer une devise spécifique

### Créer devise

- **POST** `/api/v1/currencies`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name", "symbol", "contractSize", "type" }`
- **Description**: Créer une nouvelle devise

### Mettre à jour devise

- **PUT** `/api/v1/currencies/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name", "symbol", "contractSize", "type" }`
- **Description**: Mettre à jour une devise

### Supprimer devise

- **DELETE** `/api/v1/currencies/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer une devise

## 🏢 Prop Firms

### Liste des prop firms

- **GET** `/api/v1/prop-firms`
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `page`, `limit`
- **Description**: Récupérer la liste des prop firms

### Prop firm par ID

- **GET** `/api/v1/prop-firms/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer une prop firm spécifique

### Créer prop firm

- **POST** `/api/v1/prop-firms`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name", "logoUrl" }`
- **Description**: Créer une nouvelle prop firm

### Mettre à jour prop firm

- **PUT** `/api/v1/prop-firms/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "name", "logoUrl" }`
- **Description**: Mettre à jour une prop firm

### Supprimer prop firm

- **DELETE** `/api/v1/prop-firms/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer une prop firm

## 💬 Commentaires

### Créer commentaire

- **POST** `/api/v1/comments`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content", "idAnalysis" }`
- **Description**: Créer un nouveau commentaire sur une analyse

### Commentaires par analyse

- **GET** `/api/v1/comments/analysis/:analysisId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer tous les commentaires d'une analyse

### Commentaire par ID

- **GET** `/api/v1/comments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer un commentaire spécifique

### Mettre à jour commentaire

- **PUT** `/api/v1/comments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content" }`
- **Description**: Mettre à jour un commentaire (seul le propriétaire peut modifier)

### Supprimer commentaire

- **DELETE** `/api/v1/comments/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Supprimer un commentaire (seul le propriétaire peut supprimer)

## 💬 Messages

### Envoyer message

- **POST** `/api/v1/messages`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "content", "recipientId" }`
- **Description**: Envoyer un message privé à un autre utilisateur

### Conversations

- **GET** `/api/v1/messages/conversations`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer la liste des conversations de l'utilisateur connecté

### Messages d'une conversation

- **GET** `/api/v1/messages/conversation/:otherUserId`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer tous les messages d'une conversation avec un utilisateur spécifique

### Message par ID

- **GET** `/api/v1/messages/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer un message spécifique par son ID

### Marquer comme lu

- **PATCH** `/api/v1/messages/:id/read`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Marquer un message comme lu

### Messages non lus

- **GET** `/api/v1/messages/unread/count`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Récupérer le nombre de messages non lus

### Supprimer message

- Toutes les requêtes nécessitant une authentification utilisent automatiquement le token Bearer
- Les erreurs sont retournées avec des codes HTTP appropriés et des messages explicites
- La pagination est disponible pour les listes avec les paramètres `page` et `limit`
- Les recherches textuelles sont disponibles avec le paramètre `search`

## 🚨 Signalements

### Système de Signalement

- **POST** `/api/v1/reports` - Créer un signalement (analyse ou commentaire)
- **GET** `/api/v1/reports` - Récupérer tous les signalements (admin)
- **GET** `/api/v1/reports/:id` - Récupérer un signalement par ID
- **GET** `/api/v1/reports/analysis/:analysisId` - Signalements d'une analyse
- **GET** `/api/v1/reports/comment/:commentId` - Signalements d'un commentaire
- **DELETE** `/api/v1/reports/:id` - Supprimer un signalement

### Types de Signalements

- **Signalement d'analyse** : Spécifier `idAnalysis` dans le body
- **Signalement de commentaire** : Spécifier `idComment` dans le body
- Un seul type de signalement à la fois (analyse OU commentaire)

### Règles de Signalement

- Impossible de signaler son propre contenu
- Un seul signalement par utilisateur par contenu
- Contenu du signalement obligatoire
- Accès restreint pour la consultation (admin)

## 👑 Administration

### Dashboard et Statistiques

- **GET** `/api/v1/admin/stats` - Statistiques globales du dashboard admin
  - Nombre total d'utilisateurs
  - Utilisateurs connectés
  - Commentaires signalés
  - Analyses signalées

### Gestion des Utilisateurs

- **GET** `/api/v1/admin/users` - Liste complète des utilisateurs
  - Inclut les avertissements et statut de bannissement
  - Accès admin uniquement

### Gestion des Rôles Analyste

- **GET** `/api/v1/admin/analysts` - Liste de tous les analystes
  - Inclut les statistiques de publications et commentaires
  - Accès admin uniquement
- **POST** `/api/v1/admin/user/:id/analyst` - Ajouter le rôle analyste
  - Permet à l'utilisateur de créer des analyses
  - Vérification que l'utilisateur n'est pas déjà analyste
- **DELETE** `/api/v1/admin/user/:id/analyst` - Retirer le rôle analyste
  - Retire les privilèges de création d'analyses
  - Vérification que l'utilisateur est analyste

### Contenu Signalé

- **GET** `/api/v1/admin/reported-comments` - Commentaires signalés
  - Détails complets des commentaires et signalements
- **GET** `/api/v1/admin/reported-analyses` - Analyses signalées
  - Détails complets des analyses et signalements

### Actions de Modération

#### Suppression de Contenu

- **DELETE** `/api/v1/admin/comment/:id` - Supprimer un commentaire signalé
- **DELETE** `/api/v1/admin/analysis/:id` - Supprimer une analyse signalée

#### Gestion des Utilisateurs

- **POST** `/api/v1/admin/user/:id/warn` - Avertir un utilisateur
  - Incrémente le compteur d'avertissements
  - Bannissement automatique après 3 avertissements
- **POST** `/api/v1/admin/user/:id/ban` - Bannir un utilisateur
  - Body: `{ "reason": "Raison du bannissement" }`
  - Bannissement immédiat avec raison
- **DELETE** `/api/v1/admin/user/:id` - Supprimer définitivement un utilisateur
  - Action irréversible
  - Supprime toutes les données associées

### Système d'Avertissements

- **Compteur d'avertissements** : 0 à 3 par utilisateur
- **Bannissement automatique** : Après 3 avertissements
- **Bannissement manuel** : Possible à tout moment avec raison
- **Statut utilisateur** : `warnings`, `isBanned`, `banReason`

### Variables d'Environnement Admin

Ajoutez la variable `admin_token` dans Postman :

```json
{
  "admin_token": "token-jwt-admin-ici"
}
```

### Workflow d'Administration

1. **Connexion Admin** : Utilisez un compte avec privilèges admin
2. **Consultation Dashboard** : Vérifiez les statistiques et signalements
3. **Modération** : Avertir, bannir ou supprimer selon les cas
4. **Nettoyage** : Supprimer le contenu inapproprié

### Sécurité Admin

- **Middleware isAdmin** : Vérification des privilèges sur toutes les routes
- **Logs d'actions** : Toutes les actions admin sont tracées
- **Validation stricte** : Vérification des permissions avant chaque action

## 🔧 Utilisation

### 1. Configuration initiale

1. Importer la collection Postman
2. Configurer les variables d'environnement
3. Créer un compte utilisateur via l'endpoint d'inscription

### 2. Authentification

1. Se connecter via l'endpoint de login
2. Le token JWT sera automatiquement géré par Postman
3. Toutes les requêtes authentifiées utiliseront ce token

### 3. Utilisation des endpoints

- Chaque endpoint est préconfiguré avec les bons headers
- Les exemples de données sont fournis dans le body des requêtes
- Les variables sont utilisées pour les IDs dynamiques

### 4. Gestion des erreurs

- Les codes de statut HTTP sont documentés
- Les messages d'erreur sont explicites
- Validation des données côté serveur

## 📝 Notes importantes

- Tous les endpoints nécessitant une authentification utilisent le header `Authorization: Bearer <token>`
- Les IDs sont des UUIDs générés automatiquement
- La pagination est disponible pour les listes (paramètres `page` et `limit`)
- La recherche est disponible pour certains endpoints (paramètre `search`)
- Les dates sont au format ISO 8601
- Les mots de passe doivent respecter les règles de sécurité

## 🚀 Déploiement

### Variables d'environnement de production

- `base_url`: URL de votre serveur de production
- `api_prefix`: Préfixe de l'API (généralement `/api/v1`)
- `auth_token`: Sera automatiquement géré lors de la connexion

### Sécurité

- Utilisez HTTPS en production
- Gardez vos tokens JWT sécurisés
- Ne partagez pas vos tokens d'authentification
- Utilisez des mots de passe forts
