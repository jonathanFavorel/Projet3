const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe('Users API', () => {
  let authToken;
  let testUserId;
  let testUserData;

  beforeAll(async () => {
    // Nettoyer tous les utilisateurs de test potentiels
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'newuser@example.com' },
          { email: 'updateuser@example.com' },
          { email: 'deleteuser@example.com' },
          { nameTag: 'testuser' },
          { nameTag: 'newuser' },
          { nameTag: 'updateuser' },
          { nameTag: 'deleteuser' },
        ],
      },
    });

    // Créer un utilisateur de test pour l'authentification
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const testUser = await prisma.user.create({
      data: {
        nameTag: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: hashedPassword,
        isConnected: false,
      },
    });

    // Générer un token JWT
    authToken = jwt.sign(
      { userId: testUser.idUser, email: testUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    testUserId = testUser.idUser;
    testUserData = testUser;
  });

  afterAll(async () => {
    // Nettoyer tous les utilisateurs de test créés
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'test@example.com' },
          { email: 'newuser@example.com' },
          { email: 'updateuser@example.com' },
          { email: 'deleteuser@example.com' },
          { nameTag: 'testuser' },
          { nameTag: 'newuser' },
          { nameTag: 'updateuser' },
          { nameTag: 'deleteuser' },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/users', () => {
    const validUserData = {
      nameTag: 'newuser',
      firstname: 'New',
      lastname: 'User',
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      phone: '+33123456789',
      bio: 'Test bio',
    };

    test('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur créé avec succès');
      expect(response.body.data).toHaveProperty('idUser');
      expect(response.body.data.nameTag).toBe(validUserData.nameTag);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return 400 for invalid nameTag', async () => {
      const invalidData = { ...validUserData, nameTag: 'ab' };
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return 400 for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak' };
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 409 for duplicate email', async () => {
      const duplicateData = { ...validUserData, email: testUserData.email };
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe déjà');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send(validUserData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users', () => {
    test('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=0&limit=200')
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
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
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idUser).toBe(testUserId);
      expect(response.body.data.nameTag).toBe(testUserData.nameTag);
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/v1/users/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
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
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid data', async () => {
      const invalidData = { firstname: 'A' }; // Trop court
      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
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
        .patch(`/api/v1/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .patch(`/api/v1/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .patch(`/api/v1/users/${testUserId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .patch(`/api/v1/users/${fakeId}/password`)
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Utilisateur non trouvé');
    });

    test('should return 400 for invalid UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/users/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    test('should not expose password in responses', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should validate UUID format strictly', async () => {
      const response = await request(app)
        .get('/api/v1/users/not-a-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize input data', async () => {
      const maliciousData = {
        nameTag: 'test<script>alert("xss")</script>',
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
