const request = require('supertest');
const app = require('../index');
let token;
let currencyId;
let userEmail;
const userPassword = 'Test1234!';

describe('CRUD Devises', () => {
  beforeAll(async () => {
    // Création d'un utilisateur admin pour obtenir un token
    userEmail = `testcurrency${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `testcurrency${Date.now()}`,
        firstname: 'Test',
        lastname: 'Currency',
        email: userEmail,
        password: userPassword,
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    token = loginRes.body.data.token;
  });

  it('crée une devise', async () => {
    const res = await request(app)
      .post('/api/v1/currencies')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'EUR', symbol: '€', contractSize: 1000, type: 'fiat' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    currencyId = res.body.data.idCurrency;
  });

  it('récupère toutes les devises', async () => {
    const res = await request(app).get('/api/v1/currencies');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère une devise par ID', async () => {
    const res = await request(app).get(`/api/v1/currencies/${currencyId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idCurrency).toBe(currencyId);
  });

  it('met à jour une devise', async () => {
    const res = await request(app)
      .put(`/api/v1/currencies/${currencyId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'EUR', symbol: '€', contractSize: 2000, type: 'fiat' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contractSize).toBe(2000);
  });

  it('supprime une devise', async () => {
    const res = await request(app)
      .delete(`/api/v1/currencies/${currencyId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur sur devise inexistante', async () => {
    const res = await request(app).get('/api/v1/currencies/invalid-id');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });
});
