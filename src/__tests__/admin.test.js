const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const app = require('../index');

const prisma = new PrismaClient();
let adminToken, userToken;
let adminId, userId;
let analysisId, commentId;
let adminEmail, userEmail;
const userPassword = 'Test1234!';

describe('Admin Dashboard', () => {
  beforeAll(async () => {
    // Création d'un utilisateur admin et d'un utilisateur normal
    const timestamp = Date.now();
    adminEmail = `admin${timestamp}@test.com`;
    userEmail = `user${timestamp}@test.com`;

    // Hasher le mot de passe pour l'admin
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Créer l'utilisateur admin directement en base
    const adminUser = await prisma.user.create({
      data: {
        nameTag: `admin${timestamp}`,
        firstname: 'Admin',
        lastname: 'Test',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      },
    });
    adminId = adminUser.idUser;

    // Créer l'utilisateur normal
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `user${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmail,
        password: userPassword,
      });

    // Connexion des utilisateurs
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: userPassword });
    adminToken = adminLoginRes.body.data.token;

    const userLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    userToken = userLoginRes.body.data.token;
    userId = userLoginRes.body.data.user.idUser;

    // Créer une analyse et un commentaire pour les tests
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Analyse pour test admin',
        content: 'Contenu de test pour admin',
      });
    analysisId = analysisRes.body.data.idAnalysis;

    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Commentaire pour test admin',
        idAnalysis: analysisId,
      });
    commentId = commentRes.body.data.idComment;

    // Créer des signalements pour les tests
    await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: 'Signalement analyse',
        idAnalysis: analysisId,
      });

    await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: 'Signalement commentaire',
        idComment: commentId,
      });
  });

  afterAll(async () => {
    // Nettoyage de la base de données
    await prisma.report.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.analysis.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, userEmail],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/admin/stats', () => {
    it('récupérer statistiques admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('connectedUsers');
      expect(res.body.data).toHaveProperty('reportedComments');
      expect(res.body.data).toHaveProperty('reportedAnalyses');
    });

    it('erreur accès non autorisé', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('récupérer liste utilisateurs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('warnings');
      expect(res.body.data[0]).toHaveProperty('isBanned');
    });
  });

  describe('GET /api/v1/admin/reported-comments', () => {
    it('récupérer commentaires signalés', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reported-comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/admin/reported-analyses', () => {
    it('récupérer analyses signalées', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reported-analyses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/v1/admin/comment/:id', () => {
    it('supprimer commentaire', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/comment/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('erreur commentaire inexistant', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/comment/fake-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/analysis/:id', () => {
    it('supprimer analyse', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/admin/user/:id/warn', () => {
    it('avertir utilisateur', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/user/${userId}/warn`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warnings).toBe(1);
      expect(res.body.isBanned).toBe(false);
    });

    it('avertir utilisateur 3 fois = bannissement automatique', async () => {
      // Deuxième avertissement
      await request(app)
        .post(`/api/v1/admin/user/${userId}/warn`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Troisième avertissement = bannissement automatique
      const res = await request(app)
        .post(`/api/v1/admin/user/${userId}/warn`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.warnings).toBe(3);
      expect(res.body.isBanned).toBe(true);
    });

    it('erreur avertir utilisateur banni', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/user/${userId}/warn`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/admin/user/:id/ban', () => {
    it('bannir utilisateur', async () => {
      // Créer un nouvel utilisateur pour ce test
      const timestamp = Date.now();
      const newUserEmail = `banuser${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `banuser${timestamp}`,
          firstname: 'Ban',
          lastname: 'User',
          email: newUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: newUserEmail, password: userPassword });
      const newUserId = loginRes.body.data.user.idUser;

      const res = await request(app)
        .post(`/api/v1/admin/user/${newUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Contenu inapproprié' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('erreur bannir utilisateur inexistant', async () => {
      const res = await request(app)
        .post('/api/v1/admin/user/fake-id/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/user/:id', () => {
    it('supprimer utilisateur', async () => {
      // Créer un nouvel utilisateur pour ce test
      const timestamp = Date.now();
      const deleteUserEmail = `deleteuser${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `deleteuser${timestamp}`,
          firstname: 'Delete',
          lastname: 'User',
          email: deleteUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: deleteUserEmail, password: userPassword });
      const deleteUserId = loginRes.body.data.user.idUser;

      const res = await request(app)
        .delete(`/api/v1/admin/user/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
