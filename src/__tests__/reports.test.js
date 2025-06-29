const request = require('supertest');
const app = require('../index');

describe('Reports System', () => {
  let token1, token2;
  let userId1, userId2;
  let reportId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const user1Email = `report1_${timestamp}@test.com`;
    const user2Email = `report2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `reportuser1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });

    if (registerRes1.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur 1: ${JSON.stringify(registerRes1.body)}`
      );
    }

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `reportuser2_${timestamp}`,
        firstname: 'Test',
        lastname: 'Report',
        email: user2Email,
        password,
      });

    if (registerRes2.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur 2: ${JSON.stringify(registerRes2.body)}`
      );
    }

    // Connexion du premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });

    if (
      loginRes1.statusCode !== 200 ||
      !loginRes1.body.data ||
      !loginRes1.body.data.token
    ) {
      throw new Error(
        `Échec connexion utilisateur 1: ${JSON.stringify(loginRes1.body)}`
      );
    }

    token1 = loginRes1.body.data.token;
    userId1 = loginRes1.body.data.user.idUser;

    // Connexion du deuxième utilisateur
    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user2Email, password });

    if (
      loginRes2.statusCode !== 200 ||
      !loginRes2.body.data ||
      !loginRes2.body.data.token
    ) {
      throw new Error(
        `Échec connexion utilisateur 2: ${JSON.stringify(loginRes2.body)}`
      );
    }

    token2 = loginRes2.body.data.token;
    userId2 = loginRes2.body.data.user.idUser;
  });

  it('crée un signalement', async () => {
    // Créer d'abord une analyse à signaler avec user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });

    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }

    const analysisId = analysisRes.body.data.idAnalysis;

    // User2 signale l'analyse de user1
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Test signalement',
        idAnalysis: analysisId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Test signalement');
    expect(res.body.data.idUser).toBe(userId2);
    reportId = res.body.data.idReport;
  });

  it('récupère tous les signalements', async () => {
    // Créer d'abord une analyse à signaler avec user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });

    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }

    const analysisId = analysisRes.body.data.idAnalysis;

    // User2 signale l'analyse de user1
    await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Test signalement',
        idAnalysis: analysisId,
      });

    const res = await request(app)
      .get('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère un signalement par ID', async () => {
    // Créer d'abord une analyse à signaler avec user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });

    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }

    const analysisId = analysisRes.body.data.idAnalysis;

    // User2 signale l'analyse de user1
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Test signalement',
        idAnalysis: analysisId,
      });
    const testReportId = reportRes.body.data.idReport;

    const res = await request(app)
      .get(`/api/v1/reports/${testReportId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idReport).toBe(testReportId);
  });

  it('supprime un signalement', async () => {
    // Créer d'abord une analyse à signaler avec user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });

    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }

    const analysisId = analysisRes.body.data.idAnalysis;

    // User2 signale l'analyse de user1
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Test signalement',
        idAnalysis: analysisId,
      });

    if (reportRes.statusCode !== 201) {
      throw new Error(
        `Échec création rapport: ${JSON.stringify(reportRes.body)}`
      );
    }

    const testReportId = reportRes.body.data.idReport;

    const res = await request(app)
      .delete(`/api/v1/reports/${testReportId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token1}`)
      .send({}); // Manque content
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur signalement de soi-même', async () => {
    // Créer une analyse par user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });
    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }
    const analysisId = analysisRes.body.data.idAnalysis;
    // User1 tente de signaler sa propre analyse
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test',
        idAnalysis: analysisId,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur utilisateur signalé inexistant', async () => {
    // Tente de signaler une analyse inexistante
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test',
        idAnalysis: '00000000-0000-0000-0000-000000000000',
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès signalement sans authentification', async () => {
    const res = await request(app).get('/api/v1/reports/test-id');
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès signalement non autorisé', async () => {
    // Créer un troisième utilisateur
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail3 = `report3_${timestamp}@test.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `reportuser3_${timestamp}`,
        firstname: 'Test',
        lastname: 'Report',
        email: userEmail3,
        password: 'Test1234!',
      });
    const loginRes3 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail3, password: 'Test1234!' });
    const token3 = loginRes3.body.data.token;
    // Créer une analyse par user1
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse à signaler',
        content: 'Contenu de test',
      });
    if (analysisRes.statusCode !== 201) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }
    const analysisId = analysisRes.body.data.idAnalysis;
    // User2 signale l'analyse de user1
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Test signalement',
        idAnalysis: analysisId,
      });
    if (!reportRes.body.data) {
      throw new Error(
        `Échec création signalement: ${JSON.stringify(reportRes.body)}`
      );
    }
    const testReportId = reportRes.body.data.idReport;
    // User3 essaie d'accéder au signalement
    const res = await request(app)
      .get(`/api/v1/reports/${testReportId}`)
      .set('Authorization', `Bearer ${token3}`);
    expect(res.statusCode).toBe(403);
  });

  it('erreur signalement inexistant', async () => {
    const res = await request(app)
      .get('/api/v1/reports/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(404);
  });
});
