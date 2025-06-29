import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Montée en charge douce
    { duration: '1m', target: 20 }, // Charge modérée
    { duration: '30s', target: 0 }, // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% des requêtes doivent être < 1s
    errors: ['rate<0.05'], // Taux d'erreur < 5%
  },
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-disable-rate-limit': 'true',
};

export default function () {
  // 1. Créer un utilisateur
  const registerPayload = JSON.stringify({
    nameTag: `loadtest${Date.now()}`,
    firstname: 'Load',
    lastname: 'Test',
    email: `loadtest${Date.now()}@example.com`,
    password: 'TestPass123!',
  });

  const registerResponse = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    registerPayload,
    { headers: HEADERS }
  );

  check(registerResponse, {
    'register successful': r => r.status === 201,
  });

  if (registerResponse.status !== 201) {
    return; // Arrêter si l'inscription échoue
  }

  // 2. Se connecter
  const loginPayload = JSON.stringify({
    email: `loadtest${Date.now()}@example.com`,
    password: 'TestPass123!',
  });

  const loginResponse = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    loginPayload,
    { headers: HEADERS }
  );

  check(loginResponse, {
    'login successful': r => r.status === 200,
  });

  if (loginResponse.status !== 200) {
    return;
  }

  const token = JSON.parse(loginResponse.body).data.token;

  // 3. Créer une devise
  const currencyPayload = JSON.stringify({
    name: `CURR${Date.now()}`,
    symbol: `C${Date.now()}`,
    contractSize: 1000,
    type: 'test',
  });

  const currencyResponse = http.post(
    `${BASE_URL}/api/v1/currencies`,
    currencyPayload,
    { headers: { ...HEADERS, Authorization: `Bearer ${token}` } }
  );

  check(currencyResponse, {
    'currency creation successful': r => r.status === 201,
  });

  if (currencyResponse.status !== 201) {
    return;
  }

  const currencyId = JSON.parse(currencyResponse.body).data.idCurrency;

  // 4. Créer un compte de trading
  const accountPayload = JSON.stringify({
    amount: 10000,
    idCurrency: currencyId,
  });

  const accountResponse = http.post(
    `${BASE_URL}/api/v1/accounts`,
    accountPayload,
    { headers: { ...HEADERS, Authorization: `Bearer ${token}` } }
  );

  check(accountResponse, {
    'account creation successful': r => r.status === 201,
  });

  if (accountResponse.status !== 201) {
    return;
  }

  const accountId = JSON.parse(accountResponse.body).data.idTradingAccount;

  // 5. Créer plusieurs trades
  for (let i = 0; i < 3; i++) {
    const tradePayload = JSON.stringify({
      entryPrice: 1.085 + i * 0.001,
      exitPrice: 1.09 + i * 0.001,
      takeProfit: 1.095 + i * 0.001,
      quantity: 1.0,
      status: 'closed',
      dateEntry: new Date().toISOString(),
      dateExit: new Date().toISOString(),
      idTradingAccount: accountId,
      idCurrency: currencyId,
    });

    const tradeResponse = http.post(`${BASE_URL}/api/v1/trades`, tradePayload, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    check(tradeResponse, {
      'trade creation successful': r => r.status === 201,
    });

    // 6. Récupérer les statistiques du compte
    const statsResponse = http.get(
      `${BASE_URL}/api/v1/accounts/${accountId}/stats`,
      { headers: { ...HEADERS, Authorization: `Bearer ${token}` } }
    );

    check(statsResponse, {
      'stats retrieval successful': r => r.status === 200,
      'stats have data': r => JSON.parse(r.body).data.totalTrade !== undefined,
    });

    sleep(0.5);
  }

  // 7. Récupérer tous les trades
  const tradesResponse = http.get(`${BASE_URL}/api/v1/trades`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });

  check(tradesResponse, {
    'trades retrieval successful': r => r.status === 200,
  });

  sleep(1);
}
