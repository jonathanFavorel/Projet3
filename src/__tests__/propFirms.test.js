const request = require('supertest');
const app = require('../index');
let token;
let propFirmId;
let userEmail;
const userPassword = 'Test1234!';

describe('CRUD Prop Firms', () => {
  beforeAll(async () => {
    // Création d'un utilisateur admin pour obtenir un token
    userEmail = `testpropfirm${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `testpropfirm${Date.now()}`,
        firstname: 'Test',
        lastname: 'PropFirm',
        email: userEmail,
        password: userPassword,
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    token = loginRes.body.data.token;
  });

  it('crée une firme de trading', async () => {
    const res = await request(app)
      .post('/api/v1/prop-firms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Prop Firm',
        logoUrl: 'https://testpropfirm.com/logo.png',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    propFirmId = res.body.data.idPropFirm;
  });

  it('récupère toutes les firmes de trading', async () => {
    const res = await request(app).get('/api/v1/prop-firms');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère une firme de trading par ID', async () => {
    const res = await request(app).get(`/api/v1/prop-firms/${propFirmId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idPropFirm).toBe(propFirmId);
  });

  it('met à jour une firme de trading', async () => {
    const res = await request(app)
      .put(`/api/v1/prop-firms/${propFirmId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Prop Firm Updated',
        logoUrl: 'https://testpropfirm.com/logo-updated.png',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test Prop Firm Updated');
  });

  it('supprime une firme de trading', async () => {
    const res = await request(app)
      .delete(`/api/v1/prop-firms/${propFirmId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur sur firme de trading inexistante', async () => {
    const res = await request(app).get('/api/v1/prop-firms/invalid-id');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/prop-firms')
      .set('Authorization', `Bearer ${token}`)
      .send({ logoUrl: 'https://test.com/logo.png' }); // Manque name
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
