const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let authToken;
let createdTradeId;
let currency;
let tradingAccount;

beforeAll(async () => {
  // Créer un utilisateur et récupérer un token
  const user = await prisma.user.create({
    data: {
      nameTag: 'tradetester',
      firstname: 'Trade',
      lastname: 'Tester',
      email: 'tradetester@example.com',
      password: await require('bcrypt').hash('Test1234!', 10),
    },
  });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'tradetester@example.com', password: 'Test1234!' });
  authToken = res.body.data.token;

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
      idUser: user.idUser,
      idCurrency: currency.idCurrency,
    },
  });
});

afterAll(async () => {
  await prisma.trade.deleteMany({});
  await prisma.tradingAccount.deleteMany({});
  await prisma.currency.deleteMany({});
  await prisma.user.deleteMany({ where: { email: 'tradetester@example.com' } });
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
      .send(tradeData)
      .expect(201);
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
