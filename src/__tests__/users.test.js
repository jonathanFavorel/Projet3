const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe('Users System', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const email = `user${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer l'utilisateur via l'API
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `user_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        email,
        password,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur: ${JSON.stringify(registerRes.body)}`
      );
    }

    userId = registerRes.body.data.user.idUser;

    // Se connecter pour obtenir le token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (loginRes.statusCode !== 200 || !loginRes.body.data.token) {
      throw new Error(
        `Échec connexion utilisateur: ${JSON.stringify(loginRes.body)}`
      );
    }

    token = loginRes.body.data.token;
  });

  it('récupère le profil utilisateur', async () => {
    const res = await request(app)
      .get(`/api/v1/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idUser).toBe(userId);
  });

  it('met à jour le profil utilisateur', async () => {
    const res = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstname: 'Nouveau',
        lastname: 'Nom',
        bio: 'Nouvelle bio',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.firstname).toBe('Nouveau');
    expect(res.body.data.lastname).toBe('Nom');
  });

  it('change le mot de passe', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Test1234!',
        newPassword: 'Nouveau1234!',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('supprime le compte utilisateur', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get(
      '/api/v1/users/00000000-0000-0000-0000-000000000000'
    );
    expect(res.statusCode).toBe(401);
  });

  it('erreur changement mot de passe incorrect', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${userId}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'MotDePasseIncorrect',
        newPassword: 'Nouveau1234!',
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('erreur mise à jour email déjà utilisé', async () => {
    // Créer un autre utilisateur
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const otherUserEmail = `other${timestamp}@test.com`;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `otheruser_${timestamp}`,
        firstname: 'Other',
        lastname: 'User',
        email: otherUserEmail,
        password: 'Test1234!',
      });

    const res = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: otherUserEmail });
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe('Users API', () => {
  beforeEach(async () => {
    // Créer un utilisateur de test unique pour chaque test
    const timestamp = Date.now();
    const email = `testuser${timestamp}@test.com`;
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `testuser_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        email,
        password: 'TestPassword123!',
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur de test: ${JSON.stringify(registerRes.body)}`
      );
    }

    // Se connecter pour obtenir le token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    if (loginRes.statusCode !== 200) {
      throw new Error('Échec login utilisateur de test');
    }

    // Stocker les données pour les tests
    this.testUser = registerRes.body.data.user;
    this.testToken = loginRes.body.data.token;
    this.testUserId = this.testUser.idUser;
  });

  describe('GET /api/v1/users', () => {
    test('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=test')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=0&limit=200')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/users').expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/stats', () => {
    test('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('connectedUsers');
      expect(response.body.data).toHaveProperty('newUsersThisMonth');
      expect(response.body.data).toHaveProperty('connectionRate');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/users/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should get user by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${this.testUserId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idUser).toBe(this.testUserId);
      expect(response.body.data.nameTag).toBe(this.testUser.nameTag);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${this.testUserId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    const updateData = {
      firstname: 'Updated',
      lastname: 'Name',
      bio: 'Updated bio',
    };

    test('should update user with valid data', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${this.testUserId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur mis à jour avec succès');
      expect(response.body.data.firstname).toBe(updateData.firstname);
      expect(response.body.data.lastname).toBe(updateData.lastname);
      expect(response.body.data.bio).toBe(updateData.bio);
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid data', async () => {
      const invalidData = { firstname: 'A' }; // Trop court
      const response = await request(app)
        .put(`/api/v1/users/${this.testUserId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${this.testUserId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/users/:id/password', () => {
    const passwordData = {
      currentPassword: 'TestPassword123!',
      newPassword: 'NewPassword456!',
    };

    test('should change password with valid data', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/${this.testUserId}/password`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mot de passe modifié avec succès');
    });

    test('should return 401 for incorrect current password', async () => {
      const invalidData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword789!',
      };

      const response = await request(app)
        .patch(`/api/v1/users/${this.testUserId}/password`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(invalidData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Mot de passe actuel incorrect');
    });

    test('should return 400 for weak new password', async () => {
      const invalidData = {
        currentPassword: 'TestPassword123!',
        newPassword: 'weak',
      };

      const response = await request(app)
        .patch(`/api/v1/users/${this.testUserId}/password`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .patch(`/api/v1/users/${fakeId}/password`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .send(passwordData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    let userToDelete;

    beforeAll(async () => {
      // Créer un utilisateur à supprimer
      const hashedPassword = await bcrypt.hash('DeletePassword123!', 12);
      userToDelete = await prisma.user.create({
        data: {
          nameTag: 'deleteuser',
          firstname: 'Delete',
          lastname: 'User',
          email: 'deleteuser@example.com',
          password: hashedPassword,
          isConnected: false,
        },
      });
    });

    test('should delete user successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${userToDelete.idUser}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur supprimé avec succès');

      // Vérifier que l'utilisateur a bien été supprimé
      const deletedUser = await prisma.user.findUnique({
        where: { idUser: userToDelete.idUser },
      });
      expect(deletedUser).toBeNull();
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${this.testUserId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    test('should not expose password in responses', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${this.testUserId}`)
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should validate UUID format strictly', async () => {
      const response = await request(app)
        .get('/api/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${this.testToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
