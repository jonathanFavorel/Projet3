const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('🔐 Authentification', () => {
  let testUser;

  beforeAll(async () => {
    // Nettoyer la base de données de test
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('devrait créer un nouvel utilisateur avec des données valides', async () => {
      const userData = {
        nameTag: 'testuser',
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
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
      const userData = {
        nameTag: 'testuser2',
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com', // Email déjà utilisé
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Un utilisateur avec cet email existe déjà'
      );
    });

    it("devrait refuser l'inscription avec un nameTag déjà existant", async () => {
      const userData = {
        nameTag: 'testuser', // NameTag déjà utilisé
        firstname: 'Test',
        lastname: 'User',
        email: 'test2@example.com',
        password: 'TestPass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
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
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const loginData = {
        email: 'test@example.com',
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
        email: 'test@example.com',
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
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      authToken = loginResponse.body.data.token;
    });

    it("devrait récupérer les informations de l'utilisateur connecté", async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('idUser');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.nameTag).toBe('testuser');
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
        email: 'test@example.com',
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
