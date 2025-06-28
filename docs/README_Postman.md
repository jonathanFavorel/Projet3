# 📚 Guide d'utilisation de la Collection Postman

## 🚀 Installation

1. **Importer la collection**
   - Ouvrir Postman
   - Cliquer sur "Import"
   - Sélectionner le fichier `Trading_API_Collection.json`
   - La collection sera importée avec toutes les requêtes organisées

2. **Configurer les variables d'environnement**
   - Dans Postman, aller dans l'onglet "Environments"
   - Créer un nouvel environnement "Trading API Local"
   - Ajouter les variables suivantes :
     - `base_url`: `http://localhost:3000`
     - `api_prefix`: `/api/v1`
     - `auth_token`: (vide au début, sera rempli après connexion)

## 📋 Structure de la Collection

### 🔍 Health Check

- **Health Check**: Vérifier le statut de l'API
- **API Info**: Informations générales de l'API

### 🔐 Authentification

- **Inscription**: Créer un nouveau compte utilisateur
- **Connexion**: Se connecter et récupérer le token JWT
- **Profil Utilisateur**: Récupérer les infos de l'utilisateur connecté
- **Déconnexion**: Se déconnecter

### 👥 Utilisateurs

- **Liste des Utilisateurs**: Récupérer tous les utilisateurs (avec pagination)
- **Utilisateur par ID**: Récupérer un utilisateur spécifique
- **Mettre à jour Utilisateur**: Modifier les informations d'un utilisateur
- **Supprimer Utilisateur**: Supprimer un utilisateur

### 📊 Analyses

- **Liste des Analyses**: Récupérer toutes les analyses de marché
- **Analyse par ID**: Récupérer une analyse spécifique
- **Créer une Analyse**: Créer une nouvelle analyse
- **Mettre à jour Analyse**: Modifier une analyse
- **Supprimer Analyse**: Supprimer une analyse

### 💹 Trades

- **Liste des Trades**: Récupérer tous les trades
- **Trade par ID**: Récupérer un trade spécifique
- **Créer un Trade**: Créer un nouveau trade
- **Mettre à jour Trade**: Modifier un trade
- **Supprimer Trade**: Supprimer un trade

### 💰 Comptes de Trading

- **Liste des Comptes**: Récupérer tous les comptes
- **Compte par ID**: Récupérer un compte spécifique
- **Créer un Compte**: Créer un nouveau compte
- **Mettre à jour Compte**: Modifier un compte
- **Statistiques du Compte**: Récupérer les stats d'un compte
- **Supprimer Compte**: Supprimer un compte

### 💱 Devises

- **Liste des Devises**: Récupérer toutes les devises
- **Devise par ID**: Récupérer une devise spécifique
- **Créer une Devise**: Créer une nouvelle devise

### 🏢 Firmes de Trading

- **Liste des Firmes**: Récupérer toutes les firmes
- **Firme par ID**: Récupérer une firme spécifique
- **Créer une Firme**: Créer une nouvelle firme

## 🔧 Utilisation

### 1. Test de base

1. Sélectionner l'environnement "Trading API Local"
2. Exécuter "Health Check" pour vérifier que l'API fonctionne
3. Exécuter "API Info" pour voir les informations générales

### 2. Authentification

1. Exécuter "Inscription" pour créer un compte
2. Exécuter "Connexion" pour se connecter
3. Copier le token JWT de la réponse
4. Coller le token dans la variable `auth_token` de l'environnement

### 3. Test des fonctionnalités

- Toutes les autres requêtes utiliseront automatiquement le token d'authentification
- Les requêtes sont organisées par fonctionnalité
- Chaque requête contient des exemples de données dans le body

## 📝 Exemples de données

### Utilisateur

```json
{
  "nameTag": "trader123",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "phone": "+33123456789",
  "password": "MotDePasse123!",
  "bio": "Trader passionné depuis 5 ans"
}
```

### Analyse

```json
{
  "title": "Analyse EUR/USD - Bullish",
  "content": "L'EUR/USD montre des signaux de reprise avec un support solide à 1.0850...",
  "images": [
    {
      "url": "https://example.com/chart1.png",
      "caption": "Graphique EUR/USD 4H"
    }
  ]
}
```

### Trade

```json
{
  "entryPrice": 1.085,
  "exitPrice": 1.09,
  "takeProfit": 1.095,
  "quantity": 1.0,
  "status": "CLOSED",
  "dateEntry": "2024-01-15T10:30:00Z",
  "dateExit": "2024-01-15T14:45:00Z",
  "idCurrency": "currency-uuid-here"
}
```

## 🧪 Tests automatisés

La collection inclut des tests automatiques qui vérifient :

- Le code de statut HTTP (200)
- Le temps de réponse (< 2000ms)

## 🔄 Workflow recommandé

1. **Setup initial**
   - Importer la collection
   - Configurer l'environnement
   - Tester la connexion

2. **Développement**
   - Créer un utilisateur de test
   - Tester l'authentification
   - Tester les fonctionnalités une par une

3. **Documentation**
   - Ajouter des exemples de réponses
   - Documenter les cas d'erreur
   - Mettre à jour la collection

## 📊 Monitoring

- Utiliser les logs de l'API pour déboguer
- Vérifier les réponses dans Postman
- Utiliser pgAdmin pour vérifier la base de données

## 🚨 Dépannage

### Erreurs courantes

- **401 Unauthorized**: Vérifier le token d'authentification
- **404 Not Found**: Vérifier l'URL et les paramètres
- **422 Validation Error**: Vérifier le format des données envoyées
- **500 Internal Server Error**: Vérifier les logs de l'API

### Solutions

1. Vérifier que l'API est démarrée (`docker-compose up -d`)
2. Vérifier la connexion à la base de données
3. Vérifier les variables d'environnement
4. Consulter les logs Docker (`docker-compose logs app`)
