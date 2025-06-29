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

    // Créer l'utilisateur admin via l'API
    const adminRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `admin${timestamp}`,
        firstname: 'Admin',
        lastname: 'Test',
        email: adminEmail,
        password: userPassword,
      });
    if (adminRegisterRes.statusCode !== 201) {
      throw new Error(
        `Échec création admin : ${JSON.stringify(adminRegisterRes.body)}`
      );
    }
    // Mettre à jour le rôle admin en base
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });
    // Récupérer l'id de l'admin
    adminId = adminRegisterRes.body.data.user.idUser;

    // Refaire un login pour obtenir un token admin valide
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: userPassword });
    if (adminLoginRes.statusCode !== 200) {
      throw new Error(
        `Échec login admin : ${JSON.stringify(adminLoginRes.body)}`
      );
    }
    adminToken = adminLoginRes.body.data.token;

    // Créer l'utilisateur normal
    const userRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `user${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmail,
        password: userPassword,
      });
    if (userRegisterRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur : ${JSON.stringify(userRegisterRes.body)}`
      );
    }
    userId = userRegisterRes.body.data.user.idUser;

    // Refaire un login pour obtenir un token utilisateur valide
    const userLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });
    if (userLoginRes.statusCode !== 200) {
      throw new Error(
        `Échec login utilisateur : ${JSON.stringify(userLoginRes.body)}`
      );
    }
    userToken = userLoginRes.body.data.token;

    // Créer une analyse et un commentaire pour les tests
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Analyse admin',
        content: 'Contenu de test pour admin',
      });
    if (!analysisRes.body.data || !analysisRes.body.data.idAnalysis) {
      console.error(
        'Erreur création analyse :',
        analysisRes.status,
        analysisRes.body
      );
      throw new Error('La création de l\'analyse a échoué, data manquant');
    }
    analysisId = analysisRes.body.data.idAnalysis;

    // Créer un commentaire pour les tests
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Commentaire pour test admin',
        idAnalysis: analysisId,
      });

    if (commentRes.statusCode !== 201) {
      console.error(
        'Erreur création commentaire :',
        commentRes.status,
        commentRes.body
      );
      // Créer le commentaire directement via Prisma si l'API échoue
      const comment = await prisma.comment.create({
        data: {
          content: 'Commentaire pour test admin',
          idAnalysis: analysisId,
          idUser: userId,
        },
      });
      commentId = comment.idComment;
    } else {
      commentId = commentRes.body.data.idComment;
    }

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

  describe('GET /api/v1/admin/analysts', () => {
    it('récupérer liste des analystes', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analysts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/admin/user/:id/analyst', () => {
    it('ajouter rôle analyste à un utilisateur', async () => {
      // Créer un nouvel utilisateur pour ce test
      const timestamp = Date.now();
      const analystUserEmail = `analystuser${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `analystuser${timestamp}`,
          firstname: 'Analyst',
          lastname: 'User',
          email: analystUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: analystUserEmail, password: userPassword });
      const analystUserId = loginRes.body.data.user.idUser;

      const res = await request(app)
        .post(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAnalyste).toBe(true);
    });

    it('erreur ajouter rôle analyste à un utilisateur déjà analyste', async () => {
      // Créer un utilisateur analyste
      const timestamp = Date.now();
      const analystUserEmail = `analystuser2${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `analystuser2${timestamp}`,
          firstname: 'Analyst',
          lastname: 'User',
          email: analystUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: analystUserEmail, password: userPassword });
      const analystUserId = loginRes.body.data.user.idUser;

      // Ajouter le rôle analyste une première fois
      await request(app)
        .post(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Essayer d'ajouter le rôle une deuxième fois
      const res = await request(app)
        .post(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur ajouter rôle analyste à un utilisateur inexistant', async () => {
      const res = await request(app)
        .post('/api/v1/admin/user/fake-id/analyst')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/admin/user/:id/analyst', () => {
    it('retirer rôle analyste d\'un utilisateur', async () => {
      // Créer un utilisateur analyste
      const timestamp = Date.now();
      const analystUserEmail = `analystuser3${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `analystuser3${timestamp}`,
          firstname: 'Analyst',
          lastname: 'User',
          email: analystUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: analystUserEmail, password: userPassword });
      const analystUserId = loginRes.body.data.user.idUser;

      // Ajouter le rôle analyste
      await request(app)
        .post(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Retirer le rôle analyste
      const res = await request(app)
        .delete(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAnalyste).toBe(false);
    });

    it('erreur retirer rôle analyste d\'un utilisateur non analyste', async () => {
      // Créer un utilisateur normal
      const timestamp = Date.now();
      const normalUserEmail = `normaluser${timestamp}@test.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `normaluser${timestamp}`,
          firstname: 'Normal',
          lastname: 'User',
          email: normalUserEmail,
          password: userPassword,
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: normalUserEmail, password: userPassword });
      const normalUserId = loginRes.body.data.user.idUser;

      // Essayer de retirer le rôle analyste
      const res = await request(app)
        .delete(`/api/v1/admin/user/${normalUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('erreur retirer rôle analyste d\'un utilisateur inexistant', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/user/fake-id/analyst')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
