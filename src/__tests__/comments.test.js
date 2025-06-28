const request = require('supertest');
const app = require('../index');
let token;
let commentId;
let analysisId;
let userEmail;
const userPassword = 'Test1234!';

describe('CRUD Comments', () => {
  beforeAll(async () => {
    // Création d'un utilisateur pour obtenir un token
    userEmail = `testcomment${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `testcomment${Date.now()}`,
        firstname: 'Test',
        lastname: 'Comment',
        email: userEmail,
        password: userPassword,
      });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    token = loginRes.body.data.token;

    // Création d'une analyse pour tester les commentaires
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Analyse pour commentaires',
        content: 'Contenu de test pour les commentaires',
        idUser: loginRes.body.data.user.idUser,
      });
    analysisId = analysisRes.body.data.idAnalysis;
  });

  it('crée un commentaire', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Excellent commentaire !',
        idAnalysis: analysisId,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Excellent commentaire !');
    commentId = res.body.data.idComment;
  });

  it("récupère tous les commentaires d'une analyse", async () => {
    const res = await request(app).get(
      `/api/v1/comments/analysis/${analysisId}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('récupère un commentaire par ID', async () => {
    const res = await request(app).get(`/api/v1/comments/${commentId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idComment).toBe(commentId);
    expect(res.body.data.user).toBeDefined();
  });

  it('met à jour un commentaire', async () => {
    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Commentaire mis à jour !',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Commentaire mis à jour !');
  });

  it('supprime un commentaire', async () => {
    const res = await request(app)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur sur commentaire inexistant', async () => {
    const res = await request(app).get('/api/v1/comments/invalid-id');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test' }); // Manque idAnalysis
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur modification sans authentification', async () => {
    const res = await request(app)
      .put(`/api/v1/comments/${commentId}`)
      .send({ content: 'Test non autorisé' });
    expect(res.statusCode).toBe(401);
  });

  it('erreur suppression sans authentification', async () => {
    const res = await request(app).delete(`/api/v1/comments/${commentId}`);
    expect(res.statusCode).toBe(401);
  });
});
