const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let authToken;
let createdTradeId;
let currency;
let tradingAccount;
let testUser;

beforeAll(async () => {
  // Générer un email unique
  const timestamp = Date.now();
  const userEmail = `tradetester${timestamp}@example.com`;
  const userPassword = 'Test1234!';

  // Créer un utilisateur via l'API
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      nameTag: `tradetester${timestamp}`,
      firstname: 'Trade',
      lastname: 'Tester',
      email: userEmail,
      password: userPassword,
    });

  if (registerRes.statusCode !== 201) {
    throw new Error(
      `Échec création utilisateur : ${JSON.stringify(registerRes.body)}`
    );
  }

  testUser = registerRes.body.data.user;

  // Login pour obtenir le token
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: userEmail, password: userPassword });

  if (loginRes.statusCode !== 200) {
    throw new Error(`Échec login : ${JSON.stringify(loginRes.body)}`);
  }

  authToken = loginRes.body.data.token;

  // Créer une devise pour les tests
  currency = await prisma.currency.create({
    data: {
      name: 'TestDevise',
      symbol: 'TST',
      contractSize: 1000,
      type: 'test',
    },
  });

  // Créer un compte de trading pour les tests
  tradingAccount = await prisma.tradingAccount.create({
    data: {
      amount: 10000,
      idUser: testUser.idUser,
      idCurrency: currency.idCurrency,
    },
  });
});

afterAll(async () => {
  await prisma.trade.deleteMany({});
  await prisma.tradingAccount.deleteMany({});
  await prisma.currency.deleteMany({});
  await prisma.user.deleteMany({ where: { idUser: testUser.idUser } });
  await prisma.$disconnect();
});

describe('Trades API', () => {
  test('GET /api/v1/trades (sans token) => 401', async () => {
    await request(app).get('/api/v1/trades').expect(401);
  });

  test('POST /api/v1/trades (création)', async () => {
    const tradeData = {
      entryPrice: 100,
      exitPrice: 110,
      takeProfit: 120,
      quantity: 1,
      status: 'open',
      dateEntry: new Date().toISOString(),
      dateExit: new Date().toISOString(),
      idTradingAccount: tradingAccount.idTradingAccount,
      idCurrency: currency.idCurrency,
    };
    const res = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${authToken}`)
      .send(tradeData);

    if (res.statusCode !== 201) {
      console.error('Erreur création trade :', res.status, res.body);
      throw new Error(`Échec création trade : ${JSON.stringify(res.body)}`);
    }

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('idTrade');
    createdTradeId = res.body.data.idTrade;
  });

  test('GET /api/v1/trades (avec token)', async () => {
    const res = await request(app)
      .get('/api/v1/trades')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/v1/trades/:id', async () => {
    const res = await request(app)
      .get(`/api/v1/trades/${createdTradeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('idTrade', createdTradeId);
  });

  test('PUT /api/v1/trades/:id', async () => {
    const res = await request(app)
      .put(`/api/v1/trades/${createdTradeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'closed' })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('closed');
  });

  test('DELETE /api/v1/trades/:id', async () => {
    const res = await request(app)
      .delete(`/api/v1/trades/${createdTradeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/supprimé/);
  });

  test('GET /api/v1/trades/:id (après suppression)', async () => {
    await request(app)
      .get(`/api/v1/trades/${createdTradeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
