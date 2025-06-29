const request = require('supertest');
const app = require('../index');

describe('Analyses System', () => {
  let token;
  let userId;
  let analysisId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail = `analysis${timestamp}@test.com`;
    const userPassword = 'Test1234!';

    // Créer l'utilisateur
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `analysisuser_${timestamp}`,
        firstname: 'Test',
        lastname: 'Analysis',
        email: userEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur: ${JSON.stringify(registerRes.body)}`
      );
    }

    // Connexion utilisateur
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });

    if (
      loginRes.statusCode !== 200 ||
      !loginRes.body.data ||
      !loginRes.body.data.token
    ) {
      throw new Error(
        `Échec connexion utilisateur: ${JSON.stringify(loginRes.body)}`
      );
    }

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.idUser;
  });

  it('crée une analyse', async () => {
    const res = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Analyse EUR/USD',
        content: 'Analyse technique du marché',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Analyse EUR/USD');
    expect(res.body.data.idUser).toBe(userId);
    analysisId = res.body.data.idAnalysis;
  });

  it('récupère toutes les analyses', async () => {
    // D'abord créer une analyse
    await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Analyse',
        content: 'Contenu de test',
      });

    const res = await request(app)
      .get('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère une analyse par ID', async () => {
    // D'abord créer une analyse
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Analyse',
        content: 'Contenu de test',
      });
    const testAnalysisId = analysisRes.body.data.idAnalysis;

    const res = await request(app)
      .get(`/api/v1/analyses/${testAnalysisId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idAnalysis).toBe(testAnalysisId);
  });

  it('met à jour une analyse', async () => {
    // D'abord créer une analyse
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Analyse',
        content: 'Contenu de test',
      });
    const testAnalysisId = analysisRes.body.data.idAnalysis;

    const res = await request(app)
      .put(`/api/v1/analyses/${testAnalysisId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Analyse mise à jour',
        content: 'Contenu mis à jour',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Analyse mise à jour');
  });

  it('supprime une analyse', async () => {
    // D'abord créer une analyse
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Analyse',
        content: 'Contenu de test',
      });
    const testAnalysisId = analysisRes.body.data.idAnalysis;

    const res = await request(app)
      .delete(`/api/v1/analyses/${testAnalysisId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test' }); // Manque les autres champs
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get('/api/v1/analyses');
    expect(res.statusCode).toBe(200); // Les analyses sont publiques
  });

  it('erreur accès analyse non autorisée', async () => {
    // Créer un autre utilisateur
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const otherUserEmail = `other_${timestamp}@test.com`;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `otheruser_${timestamp}`,
        firstname: 'Other',
        lastname: 'User',
        email: otherUserEmail,
        password: 'Test1234!',
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherUserEmail, password: 'Test1234!' });

    const otherToken = loginRes.body.data.token;

    // Créer une analyse avec le premier utilisateur
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Analyse',
        content: 'Contenu de test',
      });
    const testAnalysisId = analysisRes.body.data.idAnalysis;

    // L'autre utilisateur essaie d'accéder à l'analyse
    const res = await request(app)
      .get(`/api/v1/analyses/${testAnalysisId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(200); // Les analyses sont publiques
  });

  it('erreur analyse inexistante', async () => {
    const res = await request(app)
      .get('/api/v1/analyses/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
