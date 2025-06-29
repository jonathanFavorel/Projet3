import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-disable-rate-limit': 'true',
};

export default function () {
  // Générer un identifiant unique par itération
  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;
  const email = `loadtest${uniqueId}@example.com`;
  const nameTag = `loadtest${uniqueId}`;

  const registerPayload = JSON.stringify({
    nameTag,
    firstname: 'Load',
    lastname: 'Test',
    email,
    password: 'TestPass123!',
  });

  const registerResponse = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    registerPayload,
    { headers: HEADERS }
  );

  check(registerResponse, {
    'register is 201': r => r.status === 201,
    'register response time < 200ms': r => r.timings.duration < 200,
  });

  // Si l'inscription réussit, on teste la connexion
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

    check(loginResponse, {
      'login is 200': r => r.status === 200,
      'login has token': r => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.token !== undefined;
        } catch (e) {
          return false;
        }
      },
      'login response time < 200ms': r => r.timings.duration < 200,
    });

    // Si la connexion réussit, on teste les routes protégées
    if (loginResponse.status === 200) {
      try {
        const loginData = JSON.parse(loginResponse.body);
        const token = loginData.data.token;
        const authHeaders = { ...HEADERS, Authorization: `Bearer ${token}` };

        // Test de la route /me
        const meResponse = http.get(`${BASE_URL}/api/v1/auth/me`, {
          headers: authHeaders,
        });
        check(meResponse, {
          'me endpoint is 200': r => r.status === 200,
          'me response time < 100ms': r => r.timings.duration < 100,
        });

        // Test de la route des comptes
        const accountsResponse = http.get(`${BASE_URL}/api/v1/accounts`, {
          headers: authHeaders,
        });
        check(accountsResponse, {
          'accounts endpoint is 200': r => r.status === 200,
          'accounts response time < 100ms': r => r.timings.duration < 100,
        });
      } catch (e) {
        console.log('Error parsing login response:', e.message);
      }
    }
  }

  sleep(0.5);
}
