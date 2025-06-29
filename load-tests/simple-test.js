import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = { 'x-disable-rate-limit': 'true' };

export default function () {
  // Test de santé
  const healthResponse = http.get(`${BASE_URL}/health`, { headers: HEADERS });
  check(healthResponse, {
    'health check is 200': r => r.status === 200,
  });

  // Test de la route racine
  const rootResponse = http.get(`${BASE_URL}/`, { headers: HEADERS });
  check(rootResponse, {
    'root is 200': r => r.status === 200,
  });

  sleep(1);
}
