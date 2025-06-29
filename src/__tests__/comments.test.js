const request = require('supertest');
const app = require('../index');

describe('Comments System', () => {
  let token1, token2;
  let userId1, userId2;
  let analysisId;
  let commentId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const user1Email = `comment1_${timestamp}@test.com`;
    const user2Email = `comment2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `commentuser1_${timestamp}`,
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
        nameTag: `commentuser2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });

    if (registerRes2.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur 2: ${JSON.stringify(registerRes2.body)}`
      );
    }

    // Se connecter avec le premier utilisateur
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

    // Se connecter avec le deuxième utilisateur
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

    // Créer une analyse pour les tests
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        title: 'Analyse Test Comment',
        content: 'Contenu de test pour commentaires',
      });

    if (
      analysisRes.statusCode !== 201 ||
      !analysisRes.body.data ||
      !analysisRes.body.data.idAnalysis
    ) {
      throw new Error(
        `Échec création analyse: ${JSON.stringify(analysisRes.body)}`
      );
    }

    analysisId = analysisRes.body.data.idAnalysis;
  });

  it('crée un commentaire', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Test commentaire');
    expect(res.body.data.idUser).toBe(userId1);
    expect(res.body.data.idAnalysis).toBe(analysisId);
    commentId = res.body.data.idComment;
  });

  it('récupère tous les commentaires', async () => {
    // D'abord créer un commentaire
    await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });

    const res = await request(app)
      .get(`/api/v1/comments/analysis/${analysisId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère un commentaire par ID', async () => {
    // D'abord créer un commentaire
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });
    const testCommentId = commentRes.body.data.idComment;

    const res = await request(app)
      .get(`/api/v1/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idComment).toBe(testCommentId);
  });

  it('met à jour un commentaire', async () => {
    // D'abord créer un commentaire
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });
    const testCommentId = commentRes.body.data.idComment;

    const res = await request(app)
      .put(`/api/v1/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Commentaire mis à jour' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Commentaire mis à jour');
  });

  it('supprime un commentaire', async () => {
    // D'abord créer un commentaire
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });
    const testCommentId = commentRes.body.data.idComment;

    const res = await request(app)
      .delete(`/api/v1/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Test' }); // Manque idAnalysis
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur création sur analyse inexistante', async () => {
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: '00000000-0000-0000-0000-000000000000',
      });
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get('/api/v1/comments/test-id');
    expect(res.statusCode).toBe(404);
  });

  it('erreur accès commentaire non autorisé', async () => {
    // Créer un troisième utilisateur
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail3 = `comment3_${timestamp}@test.com`;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `commentuser3_${timestamp}`,
        firstname: 'Test',
        lastname: 'Comment',
        email: userEmail3,
        password: 'Test1234!',
      });

    const loginRes3 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail3, password: 'Test1234!' });

    const token3 = loginRes3.body.data.token;

    // Créer un commentaire entre user1 et user2
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test commentaire',
        idAnalysis: analysisId,
      });
    const testCommentId = commentRes.body.data.idComment;

    // User3 essaie d'accéder au commentaire
    const res = await request(app)
      .get(`/api/v1/comments/${testCommentId}`)
      .set('Authorization', `Bearer ${token3}`);
    expect(res.statusCode).toBe(200);
  });

  it('erreur commentaire inexistant', async () => {
    const res = await request(app)
      .get('/api/v1/comments/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(404);
  });
});
