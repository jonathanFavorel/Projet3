# Tests de Charge - API Trading

Ce dossier contient les scripts de test de charge pour l'API de trading.

## Prérequis

1. **k6 installé** (déjà installé via winget)
2. **API en cours d'exécution** sur `http://localhost:3000`
3. **Base de données PostgreSQL** accessible

## Scripts disponibles

### 1. Test simple (`simple-test.js`)

Test basique des routes publiques.

```bash
k6 run load-tests/simple-test.js
```

### 2. Test complet (`basic-load-test.js`)

Test complet avec authentification et routes protégées.

```bash
k6 run load-tests/basic-load-test.js
```

### 3. Test des trades (`trades-load-test.js`)

Test spécifique pour les opérations de trading (création de devises, comptes, trades).

```bash
k6 run load-tests/trades-load-test.js
```

## Interprétation des résultats

### Métriques importantes

- **http_req_duration**: Temps de réponse des requêtes
- **http_req_rate**: Nombre de requêtes par seconde
- **http_req_failed**: Taux d'échec des requêtes
- **vus**: Nombre d'utilisateurs virtuels simultanés

### Seuils définis

- **Temps de réponse**: 95% des requêtes < 500ms (simple) ou 1000ms (trades)
- **Taux d'erreur**: < 10% (simple) ou 5% (trades)

## Conseils d'utilisation

1. **Commencez par le test simple** pour vérifier que l'API répond
2. **Surveillez les ressources** (CPU, RAM, base de données) pendant les tests
3. **Ajustez les paramètres** selon vos besoins :
   - `vus`: nombre d'utilisateurs simultanés
   - `duration`: durée du test
   - `stages`: montée en charge progressive

## Exemple de sortie

```
     ✓ health check is 200
     ✓ root is 200

     checks.........................: 100.00% ✓ 20        ✗ 0
     data_received..................: 1.2 kB  40 kB/s
     data_sent......................: 1.1 kB  37 kB/s
     http_req_duration..............: avg=45.12ms min=12.34ms med=42.56ms max=89.12ms p(95)=78.45ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 20
     http_reqs......................: 20      0.67 req/s
     iteration_duration.............: avg=1.05s min=1.01s med=1.04s max=1.12s p(95)=1.10s
     iterations.....................: 20      0.67 iters/s
     vus............................: 10      min=10      max=10
     vus_max........................: 10      min=10      max=10
```

## Troubleshooting

- **Erreur de connexion**: Vérifiez que l'API est démarrée
- **Temps de réponse élevés**: Surveillez les performances de la base de données
- **Taux d'erreur élevé**: Vérifiez les logs de l'API
