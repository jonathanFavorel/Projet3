const request = require('supertest');
const app = require('../index');
let token1, token2;
let userId1, userId2;
let messageId;
let userEmail1, userEmail2;
const userPassword = 'Test1234!';

describe('Messaging System', () => {
  beforeAll(async () => {
    // Création de deux utilisateurs pour tester la messagerie
    const timestamp = Date.now();
    userEmail1 = `msg1${timestamp}@test.com`;
    userEmail2 = `msg2${timestamp}@test.com`;

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msguser1${timestamp}`,
        firstname: 'Test',
        lastname: 'Message',
        email: userEmail1,
        password: userPassword,
      });

    console.log(
      'Réponse enregistrement 1:',
      registerRes1.statusCode,
      registerRes1.body
    );

    if (registerRes1.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur 1: ${registerRes1.body.message} - ${JSON.stringify(registerRes1.body.errors)}`
      );
    }

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msguser2${timestamp}`,
        firstname: 'Test',
        lastname: 'Message',
        email: userEmail2,
        password: userPassword,
      });

    console.log(
      'Réponse enregistrement 2:',
      registerRes2.statusCode,
      registerRes2.body
    );

    if (registerRes2.statusCode !== 201) {
      throw new Error(
        `Échec création utilisateur 2: ${registerRes2.body.message} - ${JSON.stringify(registerRes2.body.errors)}`
      );
    }

    // Connexion du premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail1, password: userPassword });

    if (loginRes1.statusCode !== 200) {
      throw new Error(
        `Échec connexion utilisateur 1: ${loginRes1.body.message}`
      );
    }

    token1 = loginRes1.body.data.token;
    userId1 = loginRes1.body.data.user.idUser;

    // Connexion du deuxième utilisateur
    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail2, password: userPassword });

    if (loginRes2.statusCode !== 200) {
      throw new Error(
        `Échec connexion utilisateur 2: ${loginRes2.body.message}`
      );
    }

    token2 = loginRes2.body.data.token;
    userId2 = loginRes2.body.data.user.idUser;
  });

  it('envoie un message', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Salut ! Comment ça va ?',
        recipientId: userId2,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('Salut ! Comment ça va ?');
    expect(res.body.data.sender.idUser).toBe(userId1);
    expect(res.body.data.recipient.idUser).toBe(userId2);
    messageId = res.body.data.idMessage;
  });

  it('récupère les conversations', async () => {
    const res = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("récupère les messages d'une conversation", async () => {
    const res = await request(app)
      .get(`/api/v1/messages/conversation/${userId2}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toBeDefined();
    expect(res.body.data.otherUser).toBeDefined();
    expect(Array.isArray(res.body.data.messages)).toBe(true);
  });

  it('récupère un message par ID', async () => {
    const res = await request(app)
      .get(`/api/v1/messages/${messageId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idMessage).toBe(messageId);
  });

  it('marque un message comme lu', async () => {
    const res = await request(app)
      .patch(`/api/v1/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
  });

  it('récupère le nombre de messages non lus', async () => {
    const res = await request(app)
      .get('/api/v1/messages/unread/count')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBeDefined();
  });

  it('supprime un message', async () => {
    const res = await request(app)
      .delete(`/api/v1/messages/${messageId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur envoi sans champs requis', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Test' }); // Manque recipientId
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur envoi à soi-même', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Message à moi-même',
        recipientId: userId1,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur destinataire inexistant', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Message à un utilisateur inexistant',
        recipientId: '123e4567-e89b-12d3-a456-426614174000',
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès message sans authentification', async () => {
    const res = await request(app).get(`/api/v1/messages/${messageId}`);
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès message non autorisé', async () => {
    // Créer un nouveau message pour ce test
    const messageRes = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Message pour test autorisation',
        recipientId: userId2,
      });
    const testMessageId = messageRes.body.data.idMessage;

    // Créer un troisième utilisateur
    const timestamp = Date.now();
    const userEmail3 = `msg3${timestamp}@test.com`;

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msguser3${timestamp}`,
        firstname: 'Test',
        lastname: 'Message',
        email: userEmail3,
        password: userPassword,
      });

    const loginRes3 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail3, password: userPassword });
    const token3 = loginRes3.body.data.token;

    const res = await request(app)
      .get(`/api/v1/messages/${testMessageId}`)
      .set('Authorization', `Bearer ${token3}`);
    expect(res.statusCode).toBe(403);
  });
});
