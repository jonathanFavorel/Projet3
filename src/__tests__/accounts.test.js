const request = require('supertest');
const app = require('../index');
let token;
let createdId;
let userId;
let currencyId;
let userEmail;

describe('CRUD Trading Accounts', () => {
  beforeEach(async () => {
    // Générer des identifiants uniques pour chaque test
    const timestamp = Math.floor(Date.now() + Math.random() * 1000000)
      .toString()
      .replace(/\./g, '_');
    const userEmail = `testaccountuser${timestamp}@example.com`;
    const userPassword = 'Test1234!';

    // Créer l'utilisateur
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `testaccountuser${timestamp}`,
        firstname: 'Test',
        lastname: 'Account',
        email: userEmail,
        password: userPassword,
      });

    if (registerRes.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur: ${JSON.stringify(registerRes.body)}`
      );
    }

    userId = registerRes.body.data.user.idUser;

    // Se connecter
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: userPassword });

    if (loginRes.statusCode !== 200) {
      throw new Error(`Échec connexion: ${JSON.stringify(loginRes.body)}`);
    }

    token = loginRes.body.data.token;

    // Créer une devise
    const currencyRes = await request(app)
      .post('/api/v1/currencies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `DT${timestamp % 1000}`,
        symbol: `DT${timestamp % 100}`,
        contractSize: 1000,
        type: 'test',
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
        leverage: '100',
        isPropFirm: false,
        amount: 10000,
        idCurrency: currencyId,
      });

    if (accountRes.statusCode !== 201) {
      throw new Error(
        `Échec création compte: ${JSON.stringify(accountRes.body)}`
      );
    }

    createdId = accountRes.body.data.idTradingAccount;
  });

  test('GET /api/v1/accounts - Récupérer tous les comptes', async () => {
    const response = await request(app)
      .get('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/v1/accounts/:id - Récupérer un compte par ID', async () => {
    const response = await request(app)
      .get(`/api/v1/accounts/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.idTradingAccount).toBe(createdId);
  });

  test('PUT /api/v1/accounts/:id - Mettre à jour un compte', async () => {
    const response = await request(app)
      .put(`/api/v1/accounts/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 15000,
        leverage: 200,
        isPropFirm: true,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.amount).toBe(15000);
  });

  test('DELETE /api/v1/accounts/:id - Supprimer un compte', async () => {
    const response = await request(app)
      .delete(`/api/v1/accounts/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
