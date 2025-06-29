import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 1,
  duration: '10s',
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-disable-rate-limit': 'true',
};

export default function () {
  // Test d'inscription avec log de la réponse
  const registerPayload = JSON.stringify({
    nameTag: `test${Date.now()}`,
    firstname: 'Test',
    lastname: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
  });

  const registerResponse = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    registerPayload,
    { headers: HEADERS }
  );

  console.log('Register Status:', registerResponse.status);
  console.log('Register Body:', registerResponse.body);

  check(registerResponse, {
    'register status is 201 or 409': r => r.status === 201 || r.status === 409,
  });

  // Si l'inscription réussit, on teste la connexion
  if (registerResponse.status === 201) {
    try {
      const responseData = JSON.parse(registerResponse.body);
      console.log('Parsed response:', JSON.stringify(responseData, null, 2));

      if (responseData.data && responseData.data.token) {
        console.log(
          'Token found:',
          `${responseData.data.token.substring(0, 20)}...`
        );
      } else {
        console.log('No token in response.data');
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
    }
  }

  sleep(1);
}
