const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('🔐 Authentification', () => {
  let testUser;

  beforeAll(async () => {
    // Nettoyer tous les utilisateurs de test potentiels
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'authuser@example.com' },
          { email: 'authuser2@example.com' },
          { nameTag: 'authuser' },
          { nameTag: 'authuser2' },
        ],
      },
    });
  });

  afterAll(async () => {
    // Nettoyer tous les utilisateurs de test créés
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: 'authuser@example.com' },
          { email: 'authuser2@example.com' },
          { nameTag: 'authuser' },
          { nameTag: 'authuser2' },
        ],
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('devrait créer un nouvel utilisateur avec des données valides', async () => {
      const userData = {
        nameTag: 'authuser',
        firstname: 'Test',
        lastname: 'User',
        email: 'authuser@example.com',
        phone: '+33123456789',
        password: 'TestPass123!',
        bio: 'Utilisateur de test',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Utilisateur créé avec succès');
      expect(response.body.data.user).toHaveProperty('idUser');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nameTag).toBe(userData.nameTag);
      expect(response.body.data).toHaveProperty('token');

      testUser = response.body.data.user;
    });

    it("devrait refuser l'inscription avec un email déjà existant", async () => {
      const timestamp = Date.now();
      const firstUserData = {
        nameTag: `user1_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        email: `test${timestamp}@example.com`,
        password: 'Test1234!',
      };

      const secondUserData = {
        nameTag: `user2_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        email: `test${timestamp}@example.com`, // Même email
        password: 'Test1234!',
      };

      // Créer le premier utilisateur
      await request(app).post('/api/v1/auth/register').send(firstUserData);

      // Essayer de créer un deuxième utilisateur avec le même email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(secondUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Un utilisateur avec cet email existe déjà'
      );
    });

    it("devrait refuser l'inscription avec un nameTag déjà existant", async () => {
      const timestamp = Date.now();
      const firstUserData = {
        nameTag: `user_${timestamp}`,
        firstname: 'Test',
        lastname: 'User',
        email: `test1${timestamp}@example.com`,
        password: 'Test1234!',
      };

      const secondUserData = {
        nameTag: `user_${timestamp}`, // Même nameTag
        firstname: 'Test',
        lastname: 'User',
        email: `test2${timestamp}@example.com`,
        password: 'Test1234!',
      };

      // Créer le premier utilisateur
      await request(app).post('/api/v1/auth/register').send(firstUserData);

      // Essayer de créer un deuxième utilisateur avec le même nameTag
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(secondUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Ce nom d'utilisateur est déjà pris");
    });

    it("devrait refuser l'inscription avec des données invalides", async () => {
      const userData = {
        nameTag: 't', // Trop court
        firstname: '', // Vide
        email: 'invalid-email', // Email invalide
        password: '123', // Trop court
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Créer l'utilisateur de test via l'API avant chaque test de login
      await request(app).post('/api/v1/auth/register').send({
        nameTag: 'authuser',
        firstname: 'Test',
        lastname: 'User',
        email: 'authuser@example.com',
        password: 'TestPass123!',
      });
    });

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const loginData = {
        email: 'authuser@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Connexion réussie');
      expect(response.body.data.user).toHaveProperty('idUser');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.password).toBeUndefined(); // Le mot de passe ne doit pas être retourné
    });

    it('devrait refuser la connexion avec un email inexistant', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email ou mot de passe incorrect');
    });

    it('devrait refuser la connexion avec un mot de passe incorrect', async () => {
      const loginData = {
        email: 'authuser@example.com',
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email ou mot de passe incorrect');
    });

    it('devrait refuser la connexion avec des données invalides', async () => {
      const loginData = {
        email: 'invalid-email',
        password: '',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      // Se connecter pour obtenir un token
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'authuser@example.com',
        password: 'TestPass123!',
      });

      authToken = loginResponse.body.data.token;
    });

    it("devrait récupérer les informations de l'utilisateur connecté", async () => {
      const timestamp = Date.now();
      const email = `authuser${timestamp}@test.com`;
      const nameTag = `authuser_${timestamp}`;
      const userData = {
        nameTag,
        firstname: 'Test',
        lastname: 'User',
        email,
        password: 'TestPassword123!',
      };

      // Créer l'utilisateur
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);
      expect(registerResponse.statusCode).toBe(201);

      // Se connecter
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'TestPassword123!' });
      expect(loginResponse.statusCode).toBe(200);

      const token = loginResponse.body.data.token;

      // Récupérer les informations de l'utilisateur
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('idUser');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.user.nameTag).toBe(nameTag);
    });

    it("devrait refuser l'accès sans token", async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Token d'accès requis");
    });

    it("devrait refuser l'accès avec un token invalide", async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token invalide ou expiré');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let authToken;

    beforeAll(async () => {
      // Se connecter pour obtenir un token
      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'authuser@example.com',
        password: 'TestPass123!',
      });

      authToken = loginResponse.body.data.token;
    });

    it("devrait déconnecter l'utilisateur", async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Déconnexion réussie');
    });

    it('devrait refuser la déconnexion sans token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Token d'accès requis");
    });
  });
});
