const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Trades System', () => {
  let token;
  let userId;
  let accountId;
  let tradeId;
  let currencyId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail = `trade${timestamp}@test.com`;
    const userPassword = 'Test1234!';

    // Créer l'utilisateur
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `tradeuser_${timestamp}`,
        firstname: 'Test',
        lastname: 'Trade',
        email: userEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur: ${JSON.stringify(registerRes.body)}`
      );
    }

    // Connexion utilisateur
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });

    if (
      loginRes.statusCode !== 200 ||
      !loginRes.body.data ||
      !loginRes.body.data.token
    ) {
      throw new Error(
        `Échec connexion utilisateur: ${JSON.stringify(loginRes.body)}`
      );
    }

    token = loginRes.body.data.token;
    userId = loginRes.body.data.user.idUser;

    // Créer une devise pour le compte
    const currencyRes = await request(app)
      .post('/api/v1/currencies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'US Dollar',
        symbol: 'USD',
        contractSize: 100000,
        type: 'forex',
      });

    if (currencyRes.statusCode !== 201) {
      throw new Error(
        `Échec création devise: ${JSON.stringify(currencyRes.body)}`
      );
    }

    currencyId = currencyRes.body.data.idCurrency;

    // Créer un compte de trading
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 10000,
        idCurrency: currencyId,
        leverage: 100,
        isPropFirm: false,
      });

    if (accountRes.statusCode !== 201) {
      throw new Error(
        `Échec création compte: ${JSON.stringify(accountRes.body)}`
      );
    }

    accountId = accountRes.body.data.idTradingAccount;
  });

  it('crée un trade', async () => {
    const tradeData = {
      entryPrice: 1.1,
      exitPrice: 1.105,
      takeProfit: 1.11,
      quantity: 1.0,
      status: 'CLOSED',
      dateEntry: new Date().toISOString(),
      dateExit: new Date().toISOString(),
      idTradingAccount: accountId,
      idCurrency: currencyId,
    };

    const res = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send(tradeData);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('idTrade');
    tradeId = res.body.data.idTrade;
  });

  it('récupère tous les trades', async () => {
    // D'abord créer un trade
    await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.1,
        exitPrice: 1.105,
        takeProfit: 1.11,
        quantity: 1.0,
        status: 'CLOSED',
        dateEntry: new Date().toISOString(),
        dateExit: new Date().toISOString(),
        idTradingAccount: accountId,
        idCurrency: currencyId,
      });

    const res = await request(app)
      .get('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère un trade par ID', async () => {
    // D'abord créer un trade
    const tradeRes = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.1,
        exitPrice: 1.105,
        takeProfit: 1.11,
        quantity: 1.0,
        status: 'CLOSED',
        dateEntry: new Date().toISOString(),
        dateExit: new Date().toISOString(),
        idTradingAccount: accountId,
        idCurrency: currencyId,
      });
    const testTradeId = tradeRes.body.data.idTrade;

    const res = await request(app)
      .get(`/api/v1/trades/${testTradeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idTrade).toBe(testTradeId);
  });

  it('met à jour un trade', async () => {
    // D'abord créer un trade
    const tradeRes = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.1,
        exitPrice: 1.105,
        takeProfit: 1.11,
        quantity: 1.0,
        status: 'CLOSED',
        dateEntry: new Date().toISOString(),
        dateExit: new Date().toISOString(),
        idTradingAccount: accountId,
        idCurrency: currencyId,
      });
    const testTradeId = tradeRes.body.data.idTrade;

    const res = await request(app)
      .put(`/api/v1/trades/${testTradeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.2,
        exitPrice: 1.195,
        takeProfit: 1.21,
        quantity: 2.0,
        status: 'CLOSED',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entryPrice).toBe(1.2);
    expect(res.body.data.exitPrice).toBe(1.195);
  });

  it('supprime un trade', async () => {
    // D'abord créer un trade
    const tradeRes = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.1,
        exitPrice: 1.105,
        takeProfit: 1.11,
        quantity: 1.0,
        status: 'CLOSED',
        dateEntry: new Date().toISOString(),
        dateExit: new Date().toISOString(),
        idTradingAccount: accountId,
        idCurrency: currencyId,
      });

    if (tradeRes.statusCode !== 201) {
      throw new Error(`Échec création trade: ${JSON.stringify(tradeRes.body)}`);
    }

    const testTradeId = tradeRes.body.data.idTrade;

    const res = await request(app)
      .delete(`/api/v1/trades/${testTradeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur création sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({ symbol: 'EUR/USD' }); // Manque les autres champs
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur création sur compte inexistant', async () => {
    const res = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        symbol: 'EUR/USD',
        type: 'BUY',
        entryPrice: 1.1,
        exitPrice: 1.105,
        quantity: 1.0,
        profit: 50,
        date: new Date().toISOString(),
        idTradingAccount: '00000000-0000-0000-0000-000000000000',
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get('/api/v1/trades');
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès trade non autorisé', async () => {
    // Créer un autre utilisateur
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const otherUserEmail = `other_${timestamp}@test.com`;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `otheruser_${timestamp}`,
        firstname: 'Other',
        lastname: 'User',
        email: otherUserEmail,
        password: 'Test1234!',
      });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherUserEmail, password: 'Test1234!' });

    const otherToken = loginRes.body.data.token;

    // Créer un trade avec le premier utilisateur
    const tradeRes = await request(app)
      .post('/api/v1/trades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryPrice: 1.1,
        exitPrice: 1.105,
        takeProfit: 1.11,
        quantity: 1.0,
        status: 'CLOSED',
        dateEntry: new Date().toISOString(),
        dateExit: new Date().toISOString(),
        idTradingAccount: accountId,
        idCurrency: currencyId,
      });
    const testTradeId = tradeRes.body.data.idTrade;

    // L'autre utilisateur essaie d'accéder au trade
    const res = await request(app)
      .get(`/api/v1/trades/${testTradeId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('erreur trade inexistant', async () => {
    const res = await request(app)
      .get('/api/v1/trades/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
