const request = require('supertest');
const app = require('../index');
let token;
let createdId;

// Générer des identifiants uniques pour éviter les conflits
const uniqueEmail = `testanalyst${Date.now()}@example.com`;
const uniqueNameTag = `testanalyst${Date.now()}`;
const strongPassword = 'Test1234!';

describe('CRUD Analyses', () => {
  beforeAll(async () => {
    // Création d'un utilisateur de test via la route d'inscription avec identifiants uniques
    const userRes = await request(app).post('/api/v1/auth/register').send({
      nameTag: uniqueNameTag,
      firstname: 'Test',
      lastname: 'Analyst',
      email: uniqueEmail,
      password: strongPassword,
    });
    if (userRes.statusCode !== 201) {
      console.error('Erreur inscription:', userRes.body);
    }

    if (userRes.statusCode === 201 && userRes.body.data) {
      // Utilisateur créé, on se connecte
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: uniqueEmail, password: strongPassword });
      if (!res.body.data || !res.body.data.token) {
        console.error('Erreur login:', res.body);
        throw new Error('Échec du login, token manquant');
      }
      token = res.body.data.token;
    } else {
      // Si l'utilisateur existe déjà, on se connecte directement
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: uniqueEmail, password: strongPassword });
      if (!res.body.data || !res.body.data.token) {
        console.error('Erreur login:', res.body);
        throw new Error('Échec du login, token manquant');
      }
      token = res.body.data.token;
    }
  });

  it('crée une analyse', async () => {
    const res = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Analyse test', content: 'Contenu' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    createdId = res.body.data.idAnalysis;
  });

  it('récupère toutes les analyses', async () => {
    const res = await request(app).get('/api/v1/analyses');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère une analyse par ID', async () => {
    const res = await request(app).get(`/api/v1/analyses/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idAnalysis).toBe(createdId);
  });

  it('met à jour une analyse', async () => {
    const res = await request(app)
      .put(`/api/v1/analyses/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Analyse mise à jour', content: 'Nouveau contenu' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Analyse mise à jour');
  });

  it('supprime une analyse', async () => {
    const res = await request(app)
      .delete(`/api/v1/analyses/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur sur analyse inexistante', async () => {
    const res = await request(app).get(
      '/api/v1/analyses/123e4567-e89b-12d3-a456-426614174000'
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
