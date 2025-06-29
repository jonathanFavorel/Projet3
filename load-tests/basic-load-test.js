import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Métriques personnalisées
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Montée en charge
    { duration: '2m', target: 10 }, // Charge soutenue
    { duration: '30s', target: 0 }, // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    errors: ['rate<0.1'], // Taux d'erreur < 10%
  },
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Content-Type': 'application/json',
};

export default function () {
  // Génération de données uniques avec UUID et timestamp
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const nameTag = `testuser_${uniqueId}`;
  const email = `test_${uniqueId}@example.com`;

  // Test de la route d'inscription (POST)
  const registerPayload = JSON.stringify({
    nameTag,
    firstname: 'Test',
    lastname: 'User',
    email,
    password: 'TestPass123!',
  });

  const registerResponse = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    registerPayload,
    { headers: HEADERS }
  );

  console.log('Register response:', registerResponse.body);

  check(registerResponse, {
    'register status is 201': r => r.status === 201,
    'register has token': r => {
      try {
        const data = JSON.parse(r.body).data;
        return data && data.token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Délai pour éviter les problèmes de synchronisation
  sleep(0.1);

  // Test de la route de connexion (POST) seulement si l'inscription a réussi
  if (registerResponse.status === 201) {
    const loginPayload = JSON.stringify({
      email,
      password: 'TestPass123!',
    });

    const loginResponse = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      loginPayload,
      { headers: HEADERS }
    );

    console.log('Login response:', loginResponse.body);

    check(loginResponse, {
      'login status is 200': r => r.status === 200,
      'login has token': r => {
        try {
          const data = JSON.parse(r.body).data;
          return data && data.token !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
  }

  // Test de la route racine (GET)
  const rootResponse = http.get(`${BASE_URL}/`);
  check(rootResponse, {
    'root endpoint status is 200': r => r.status === 200,
  });

  // Test du health check (GET)
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': r => r.status === 200,
  });

  // Délai entre les itérations
  sleep(1);
}
