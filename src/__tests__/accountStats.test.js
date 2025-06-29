const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Account Stats System', () => {
  let token;
  let userId;
  let accountId;

  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail = `stats${timestamp}@test.com`;
    const userPassword = 'Test1234!';

    // Créer l'utilisateur
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `statsuser_${timestamp}`,
        firstname: 'Test',
        lastname: 'Stats',
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

    const currencyId = currencyRes.body.data.idCurrency;

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

  it("récupère les statistiques d'un compte", async () => {
    // Créer d'abord une devise pour les trades
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

    const currencyId = currencyRes.body.data.idCurrency;

    // Créer un trade pour générer des stats
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
      .get(`/api/v1/accounts/${accountId}/stats`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.idTradingAccount).toBe(accountId);
  });

  it('erreur accès sans authentification', async () => {
    const res = await request(app).get(`/api/v1/accounts/${accountId}/stats`);
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès compte non autorisé', async () => {
    // Créer un autre utilisateur
    const timestamp = Date.now() + Math.random();
    const otherUserEmail = `other${timestamp}@test.com`;

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `otheruser_${Math.floor(timestamp)}`,
        firstname: 'Other',
        lastname: 'User',
        email: otherUserEmail,
        password: 'Test1234!',
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création autre utilisateur: ${JSON.stringify(registerRes.body)}`
      );
    }

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: otherUserEmail, password: 'Test1234!' });

    if (
      loginRes.statusCode !== 200 ||
      !loginRes.body.data ||
      !loginRes.body.data.token
    ) {
      throw new Error(
        `Échec connexion autre utilisateur: ${JSON.stringify(loginRes.body)}`
      );
    }

    const otherToken = loginRes.body.data.token;

    const res = await request(app)
      .get(`/api/v1/accounts/${accountId}/stats`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('erreur compte inexistant', async () => {
    const res = await request(app)
      .get('/api/v1/accounts/00000000-0000-0000-0000-000000000000/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
