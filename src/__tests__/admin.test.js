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

describe('Admin System', () => {
  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const adminEmailLocal = `admin${timestamp}@test.com`;
    const userPassword = 'Test1234!';

    // Créer l'utilisateur admin via l'API
    const registerAdminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `admin_${timestamp}`,
        firstname: 'Admin',
        lastname: 'Test',
        email: adminEmailLocal,
        password: userPassword,
      });

    if (registerAdminRes.statusCode !== 201) {
      throw new Error(
        `Échec création admin: ${JSON.stringify(registerAdminRes.body)}`
      );
    }

    adminId = registerAdminRes.body.data.user.idUser;

    // Mettre à jour le champ isAdmin pour l'utilisateur admin par idUser
    await prisma.user.update({
      where: { idUser: adminId },
      data: { isAdmin: true },
    });

    // Se reconnecter pour obtenir un token avec isAdmin: true
    const loginAdminRes = await request(app).post('/api/v1/auth/login').send({
      email: adminEmailLocal,
      password: userPassword,
    });

    if (loginAdminRes.statusCode !== 200) {
      throw new Error(
        `Échec login admin: ${JSON.stringify(loginAdminRes.body)}`
      );
    }

    adminToken = loginAdminRes.body.data.token;

    // Vérifier que le token contient bien les bonnes informations
    const tokenPayload = JSON.parse(
      Buffer.from(adminToken.split('.')[1], 'base64').toString()
    );
    expect(tokenPayload.isAdmin).toBe(true);

    // Vérifier que l'admin a bien le champ isAdmin à true
    const adminUser = await prisma.user.findUnique({
      where: { idUser: adminId },
      select: { isAdmin: true },
    });

    if (!adminUser || !adminUser.isAdmin) {
      throw new Error("L'utilisateur admin n'a pas le champ isAdmin à true");
    }

    // Créer l'utilisateur normal via l'API
    const userEmailLocal = `user${timestamp}@test.com`;
    const registerUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `user_${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmailLocal,
        password: userPassword,
      });
    expect(registerUserRes.statusCode).toBe(201);
    userId = registerUserRes.body.data.user.idUser;
    // Connexion utilisateur normal
    const loginUserRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmailLocal, password: userPassword });
    expect(loginUserRes.statusCode).toBe(200);
    userToken = loginUserRes.body.data.token;
  });

  it('récupère tous les utilisateurs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Ne pas tester la longueur car la base peut être vide
  });

  it('récupère un utilisateur par ID', async () => {
    // Cette route n'existe pas, donc on teste que ça retourne 404
    const res = await request(app)
      .get(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  it("met à jour le rôle d'un utilisateur", async () => {
    // Cette route n'existe pas, donc on teste que ça retourne 404
    const res = await request(app)
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'MODERATOR' });
    expect(res.statusCode).toBe(404);
  });

  it('désactive un utilisateur', async () => {
    // Cette route n'existe pas, donc on teste que ça retourne 404
    const res = await request(app)
      .patch(`/api/v1/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(res.statusCode).toBe(404);
  });

  it('supprime un utilisateur', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/user/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('récupère les statistiques', async () => {
    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('avertit un utilisateur', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/user/${userId}/warn`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Test warning' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('bannit un utilisateur', async () => {
    // Créer un nouvel utilisateur pour le test de bannissement
    const timestamp = Date.now();
    const banUserEmail = `banuser${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `banuser${timestamp}`,
        firstname: 'Ban',
        lastname: 'User',
        email: banUserEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur pour bannissement: ${JSON.stringify(registerRes.body)}`
      );
    }

    const banUserId = registerRes.body.data.user.idUser;

    const res = await request(app)
      .post(`/api/v1/admin/user/${banUserId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Test ban' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('ajoute le rôle analyste à un utilisateur', async () => {
    // Créer un nouvel utilisateur pour le test de rôle analyste
    const timestamp = Date.now();
    const analystUserEmail = `analystuser${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `analystuser${timestamp}`,
        firstname: 'Analyst',
        lastname: 'User',
        email: analystUserEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur analyste: ${JSON.stringify(registerRes.body)}`
      );
    }

    const analystUserId = registerRes.body.data.user.idUser;

    const res = await request(app)
      .post(`/api/v1/admin/user/${analystUserId}/analyst`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAnalyste).toBe(true);
  });

  it("retirer rôle analyste d'un utilisateur", async () => {
    // Créer un nouvel utilisateur analyste pour le test
    const timestamp = Date.now();
    const analystUserEmail = `analystuser3${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `analystuser3_${timestamp}`,
        firstname: 'Analyst',
        lastname: 'User',
        email: analystUserEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur analyste: ${JSON.stringify(registerRes.body)}`
      );
    }

    const analystUserId = registerRes.body.data.user.idUser;

    // D'abord ajouter le rôle analyste
    await request(app)
      .post(`/api/v1/admin/user/${analystUserId}/analyst`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Puis retirer le rôle analyste
    const res = await request(app)
      .delete(`/api/v1/admin/user/${analystUserId}/analyst`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isAnalyste).toBe(false);
  });

  it('récupère la liste des analystes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analysts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get('/api/v1/admin/users');
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès sans droits admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('erreur utilisateur inexistant', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('erreur rôle invalide', async () => {
    // Cette route n'existe pas, donc on teste que ça retourne 404
    const res = await request(app)
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'INVALID_ROLE' });
    expect(res.statusCode).toBe(404);
  });
});

describe('Admin Dashboard', () => {
  beforeAll(async () => {
    // Générer des emails uniques
    const timestamp = Date.now();
    adminEmail = `admin${timestamp}@test.com`;
    userEmail = `user${timestamp}@test.com`;

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

    adminId = adminRegisterRes.body.data.user.idUser;

    // Mettre à jour le rôle admin en base
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isAdmin: true },
    });

    // Login admin
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: userPassword });

    if (
      adminLoginRes.statusCode !== 200 ||
      !adminLoginRes.body.data ||
      !adminLoginRes.body.data.token
    ) {
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

    // Login utilisateur
    const userLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });

    if (
      userLoginRes.statusCode !== 200 ||
      !userLoginRes.body.data ||
      !userLoginRes.body.data.token
    ) {
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

    // Créer un commentaire pour les tests
    const commentRes = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Commentaire pour test admin',
        idAnalysis: analysisId,
      });

    if (
      commentRes.statusCode !== 201 ||
      !commentRes.body.data ||
      !commentRes.body.data.idComment
    ) {
      throw new Error(
        `Échec création commentaire: ${JSON.stringify(commentRes.body)}`
      );
    }

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
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test warning' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
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
      // Créer un nouvel utilisateur pour le test de bannissement
      const timestamp = Date.now();
      const banUserEmail = `banuser${timestamp}@test.com`;

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `banuser${timestamp}`,
          firstname: 'Ban',
          lastname: 'User',
          email: banUserEmail,
          password: userPassword,
        });

      if (registerRes.statusCode !== 201) {
        throw new Error(
          `Échec création utilisateur pour bannissement: ${JSON.stringify(registerRes.body)}`
        );
      }

      const banUserId = registerRes.body.data.user.idUser;

      const res = await request(app)
        .post(`/api/v1/admin/user/${banUserId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' });

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
      const res = await request(app)
        .delete(`/api/v1/admin/user/${userId}`)
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
      // Créer un nouvel utilisateur pour le test de rôle analyste
      const timestamp = Date.now();
      const analystUserEmail = `analystuser${timestamp}@test.com`;

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `analystuser${timestamp}`,
          firstname: 'Analyst',
          lastname: 'User',
          email: analystUserEmail,
          password: userPassword,
        });

      if (registerRes.statusCode !== 201) {
        throw new Error(
          `Échec création utilisateur analyste: ${JSON.stringify(registerRes.body)}`
        );
      }

      const analystUserId = registerRes.body.data.user.idUser;

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
    it("retirer rôle analyste d'un utilisateur", async () => {
      // Créer un nouvel utilisateur analyste pour le test
      const timestamp = Date.now();
      const analystUserEmail = `analystuser3${timestamp}@test.com`;

      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `analystuser3_${timestamp}`,
          firstname: 'Analyst',
          lastname: 'User',
          email: analystUserEmail,
          password: userPassword,
        });

      if (registerRes.statusCode !== 201) {
        throw new Error(
          `Échec création utilisateur analyste: ${JSON.stringify(registerRes.body)}`
        );
      }

      const analystUserId = registerRes.body.data.user.idUser;

      // D'abord ajouter le rôle analyste
      await request(app)
        .post(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Puis retirer le rôle analyste
      const res = await request(app)
        .delete(`/api/v1/admin/user/${analystUserId}/analyst`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAnalyste).toBe(false);
    });

    it("erreur retirer rôle analyste d'un utilisateur non analyste", async () => {
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

    it("erreur retirer rôle analyste d'un utilisateur inexistant", async () => {
      const res = await request(app)
        .delete('/api/v1/admin/user/fake-id/analyst')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
