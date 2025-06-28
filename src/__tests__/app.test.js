const request = require('supertest');
const app = require('../index');

describe('API Trading Backend', () => {
  describe('GET /', () => {
    it('devrait retourner un message de bienvenue', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Bienvenue');
    });
  });

  describe('GET /health', () => {
    it("devrait retourner le statut de santé de l'API", async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Routes API', () => {
    it('devrait retourner 401 pour la route utilisateurs sans authentification', async () => {
      const response = await request(app).get('/api/v1/users');
      expect(response.status).toBe(401);
    });

    it("devrait retourner 400 pour la route d'authentification sans body", async () => {
      const response = await request(app).post('/api/v1/auth/login');
      expect(response.status).toBe(400);
    });
  });

  describe("Gestion d'erreurs", () => {
    it('devrait retourner 404 pour une route inexistante', async () => {
      const response = await request(app).get('/route-inexistante');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
