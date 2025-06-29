const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('AccountStats API', () => {
  let testUser, testCurrency, testTradingAccount, testAccountStats, authToken;

  beforeAll(async () => {
    // Générer un email et un nameTag uniques
    const uniqueId = Date.now();
    const email = `teststats${uniqueId}@example.com`;
    const nameTag = `teststatsuser${uniqueId}`;
    const password = 'Test1234!';

    // Créer un utilisateur de test via l'API
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      nameTag,
      firstname: 'Test',
      lastname: 'Stats',
      email,
      password,
    });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur : ${JSON.stringify(registerRes.body)}`
      );
    }

    testUser = registerRes.body.data.user;

    // Obtenir un token d'authentification pour testUser
    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email,
      password,
    });
    authToken = loginResponse.body.data
      ? loginResponse.body.data.token
      : undefined;

    // Créer une devise de test
    testCurrency = await prisma.currency.create({
      data: {
        name: 'Test Currency Stats',
        symbol: 'TST',
        contractSize: 1000,
        type: 'test',
      },
    });

    // Créer un compte de trading de test pour testUser
    testTradingAccount = await prisma.tradingAccount.create({
      data: {
        amount: 10000,
        idUser: testUser.idUser,
        idCurrency: testCurrency.idCurrency,
      },
    });

    // Créer des statistiques de test pour ce compte
    testAccountStats = await prisma.accountStats.create({
      data: {
        idTradingAccount: testTradingAccount.idTradingAccount,
        totalTrade: 10,
        winningTrade: 6,
        losingTrade: 3,
        breakEvenTrade: 1,
        profit: 1500,
        loss: 500,
        winRate: 60,
        averageWin: 250,
        averageLoss: 167,
        profitFactor: 3,
        averageTrade: 100,
        rankAccount: 1,
      },
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.accountStats.deleteMany({
      where: { idTradingAccount: testTradingAccount.idTradingAccount },
    });
    await prisma.tradingAccount.deleteMany({
      where: { idTradingAccount: testTradingAccount.idTradingAccount },
    });
    await prisma.user.deleteMany({
      where: { idUser: testUser.idUser },
    });
    await prisma.currency.deleteMany({
      where: { idCurrency: testCurrency.idCurrency },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/v1/accounts/:id/stats', () => {
    test('devrait récupérer les statistiques d\'un compte avec un token valide', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testTradingAccount.idTradingAccount}/stats`)
        .set('Authorization', `Bearer ${authToken}`);
      if (response.status !== 200) {
        console.error('Réponse inattendue:', response.status, response.body);
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.idTradingAccount).toBe(
        testTradingAccount.idTradingAccount
      );
      expect(response.body.data.totalTrade).toBe(10);
      expect(response.body.data.winningTrade).toBe(6);
      expect(response.body.data.losingTrade).toBe(3);
      expect(response.body.data.breakEvenTrade).toBe(1);
      expect(response.body.data.profit).toBe(1500);
      expect(response.body.data.loss).toBe(500);
      expect(response.body.data.winRate).toBe(60);
      expect(response.body.data.averageWin).toBe(250);
      expect(response.body.data.averageLoss).toBe(167);
      expect(response.body.data.profitFactor).toBe(3);
      expect(response.body.data.averageTrade).toBe(100);
    });

    test('devrait retourner 401 sans token d\'authentification', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testTradingAccount.idTradingAccount}/stats`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token d\'accès requis');
    });

    test('devrait retourner 403 avec un token invalide', async () => {
      const response = await request(app)
        .get(`/api/v1/accounts/${testTradingAccount.idTradingAccount}/stats`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Token invalide ou expiré');
    });

    test('devrait retourner 404 pour un compte inexistant', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/999999/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Statistiques non trouvées');
    });

    test('devrait retourner 404 pour un ID de compte invalide', async () => {
      const response = await request(app)
        .get('/api/v1/accounts/invalid-id/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Statistiques non trouvées');
    });
  });
});
