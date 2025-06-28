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
