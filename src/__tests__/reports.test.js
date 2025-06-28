const request = require('supertest');
const app = require('../index');
let token1, token2;
let userId1, userId2;
let reportId;
let analysisId;
let commentId;
let userEmail1, userEmail2;
const userPassword = 'Test1234!';

describe('Reporting System', () => {
  beforeAll(async () => {
    // Création de deux utilisateurs pour tester le signalement
    const timestamp = Date.now();
    userEmail1 = `report1${timestamp}@test.com`;
    userEmail2 = `report2${timestamp}@test.com`;

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `reportuser1${timestamp}`,
        firstname: 'Test',
        lastname: 'Report',
        email: userEmail1,
        password: userPassword,
      });

    if (registerRes1.status !== 201) {
      console.log('Erreur enregistrement 1:', registerRes1.body);
    }

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `reportuser2${timestamp}`,
        firstname: 'Test',
        lastname: 'Report',
        email: userEmail2,
        password: userPassword,
      });

    if (registerRes2.status !== 201) {
      console.log('Erreur enregistrement 2:', registerRes2.body);
    }

    // Connexion des utilisateurs
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail1, password: userPassword });
    token1 = loginRes1.body.data.token;
    userId1 = loginRes1.body.data.user.idUser;

    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail2, password: userPassword });
    token2 = loginRes2.body.data.token;
    userId2 = loginRes2.body.data.user.idUser;

    // Créer une analyse pour tester le signalement
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        title: 'Analyse pour test signalement',
        content: 'Contenu de test pour signalement',
      });
    analysisId = analysisRes.body.data.idAnalysis;

    // Créer un commentaire pour tester le signalement
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        content: 'Commentaire pour test signalement',
        idAnalysis: analysisId,
      });
    commentId = commentRes.body.data.idComment;
  });

  describe('POST /api/v1/reports', () => {
    it('créer signalement analyse', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Cette analyse contient du contenu inapproprié',
          idAnalysis: analysisId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(
        'Cette analyse contient du contenu inapproprié'
      );
      expect(res.body.data.analysis.idAnalysis).toBe(analysisId);
      expect(res.body.data.comment).toBeNull();
      reportId = res.body.data.idReport;
    });

    it('créer signalement commentaire', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Ce commentaire est inapproprié',
          idComment: commentId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Ce commentaire est inapproprié');
      expect(res.body.data.comment.idComment).toBe(commentId);
      expect(res.body.data.analysis).toBeNull();
    });

    it('erreur signalement sans contenu', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          idAnalysis: analysisId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement sans cible', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Test sans cible',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement analyse et commentaire', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Test avec deux cibles',
          idAnalysis: analysisId,
          idComment: commentId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement analyse inexistante', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Test analyse inexistante',
          idAnalysis: 'fake-analysis-id',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement commentaire inexistant', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Test commentaire inexistant',
          idComment: 'fake-comment-id',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement propre analyse', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          content: 'Test signalement propre analyse',
          idAnalysis: analysisId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement propre commentaire', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          content: 'Test signalement propre commentaire',
          idComment: commentId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur signalement déjà existant', async () => {
      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          content: 'Signalement en double',
          idAnalysis: analysisId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reports', () => {
    it('récupérer tous les signalements', async () => {
      const res = await request(app)
        .get('/api/v1/reports')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/reports/:id', () => {
    it('récupérer signalement par ID', async () => {
      const res = await request(app)
        .get(`/api/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.idReport).toBe(reportId);
    });

    it('erreur signalement inexistant', async () => {
      const res = await request(app)
        .get('/api/v1/reports/fake-report-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reports/analysis/:analysisId', () => {
    it("récupérer signalements d'une analyse", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('erreur analyse inexistante', async () => {
      const res = await request(app)
        .get('/api/v1/reports/analysis/fake-analysis-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/reports/comment/:commentId', () => {
    it("récupérer signalements d'un commentaire", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/comment/${commentId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('erreur commentaire inexistant', async () => {
      const res = await request(app)
        .get('/api/v1/reports/comment/fake-comment-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/reports/:id', () => {
    it('supprimer signalement autorisé', async () => {
      const res = await request(app)
        .delete(`/api/v1/reports/${reportId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('erreur suppression signalement inexistant', async () => {
      const res = await request(app)
        .delete('/api/v1/reports/fake-report-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
