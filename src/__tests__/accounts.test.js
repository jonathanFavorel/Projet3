const request = require('supertest');
const app = require('../index');
let token;
let createdId;
let userId;
let currencyId;
let userEmail;

describe('CRUD Trading Accounts', () => {
  beforeAll(async () => {
    // Fonction pour créer un utilisateur unique avec retry
    const createUniqueUser = async (attempt = 1) => {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000);
      userEmail = `testaccountuser${timestamp}${randomSuffix}@example.com`;

      console.log(
        `Tentative ${attempt} : création utilisateur avec email ${userEmail}`
      );

      const userRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          nameTag: `testaccountuser${timestamp}${randomSuffix}`,
          firstname: 'Test',
          lastname: 'Account',
          email: userEmail,
          password: 'Test1234!',
        });

      console.log(
        `Réponse création utilisateur : ${userRes.statusCode} - ${JSON.stringify(userRes.body)}`
      );

      if (userRes.statusCode === 201) {
        console.log('✅ Utilisateur créé avec succès');
        return { userEmail, timestamp };
      } else if (userRes.statusCode === 409 && attempt < 5) {
        console.log('⚠️ Conflit, nouvelle tentative...');
        return createUniqueUser(attempt + 1);
      } else {
        throw new Error(
          `Échec création utilisateur après ${attempt} tentatives : ${userRes.statusCode} - ${JSON.stringify(userRes.body)}`
        );
      }
    };

    try {
      // Créer un utilisateur unique
      const { userEmail: email, timestamp } = await createUniqueUser();
      userEmail = email;

      // Login obligatoire pour récupérer le token
      console.log('🔐 Tentative de login...');
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userEmail, password: 'Test1234!' });

      console.log(
        `Réponse login : ${loginRes.statusCode} - ${JSON.stringify(loginRes.body)}`
      );

      if (!loginRes.body.data || !loginRes.body.data.token) {
        throw new Error(
          `Login échoué : ${loginRes.statusCode} - ${JSON.stringify(loginRes.body)}`
        );
      }

      token = loginRes.body.data.token;
      console.log('✅ Login réussi, token obtenu');

      // Récupérer l'idUser via /api/v1/users?search=email
      console.log("🔍 Récupération de l'idUser...");
      const usersRes = await request(app)
        .get(`/api/v1/users?search=${encodeURIComponent(userEmail)}`)
        .set('Authorization', `Bearer ${token}`);

      console.log(
        `Réponse recherche utilisateur : ${usersRes.statusCode} - ${JSON.stringify(usersRes.body)}`
      );

      if (!usersRes.body.data || usersRes.body.data.length === 0) {
        throw new Error('Utilisateur introuvable après login');
      }

      userId = usersRes.body.data[0].idUser;
      console.log(`✅ idUser récupéré : ${userId}`);

      // Création d'une devise
      console.log('💰 Création de la devise...');
      const currencyRes = await request(app)
        .post('/api/v1/currencies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `DT${timestamp % 10000}`,
          symbol: `DT${timestamp % 1000}`,
          contractSize: 1000,
          type: 'test',
        });

      console.log(
        `Réponse création devise : ${currencyRes.statusCode} - ${JSON.stringify(currencyRes.body)}`
      );

      if (currencyRes.statusCode === 201) {
        currencyId = currencyRes.body.data.idCurrency;
        console.log(`✅ Devise créée : ${currencyId}`);
      } else {
        throw new Error(
          `Erreur lors de la création de la devise : ${currencyRes.statusCode} - ${JSON.stringify(currencyRes.body)}`
        );
      }

      console.log('🎉 Setup terminé avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors du setup :', error.message);
      throw error;
    }
  });

  it('crée un compte de trading', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000, idCurrency: currencyId, idUser: userId });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    createdId = res.body.data.idTradingAccount;
  });

  it('récupère tous les comptes', async () => {
    const res = await request(app).get('/api/v1/accounts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('récupère un compte par ID', async () => {
    const res = await request(app).get(`/api/v1/accounts/${createdId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idTradingAccount).toBe(createdId);
  });

  it('met à jour un compte', async () => {
    const res = await request(app)
      .put(`/api/v1/accounts/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 20000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(20000);
  });

  it('supprime un compte', async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur sur compte inexistant', async () => {
    const res = await request(app).get('/api/v1/accounts/invalid-id');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });
});
