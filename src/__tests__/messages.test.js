const request = require('supertest');
const app = require('../index');

describe('Messaging System', () => {
  it('envoie un message', async () => {
    const timestamp = Date.now();
    const user1Email = `msg1_${timestamp}@test.com`;
    const user2Email = `msg2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msg1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const userId1 = registerRes1.body.data.user.idUser;

    // Connexion utilisateur 1
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msg2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const userId2 = registerRes2.body.data.user.idUser;

    // Connexion utilisateur 2
    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user2Email, password });
    expect(loginRes2.statusCode).toBe(200);
    const token2 = loginRes2.body.data.token;

    const messageData = {
      content: 'Test message',
      recipientId: userId2,
    };

    console.log('Envoi message:', { senderId: userId1, recipientId: userId2 });

    // Vérifier que le destinataire existe
    const userCheckRes = await request(app)
      .get(`/api/v1/users/${userId2}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(userCheckRes.statusCode).toBe(200);

    // Envoyer un message
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: userId2,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('idMessage');
    expect(res.body.data.content).toBe('Test message');
    expect(res.body.data.senderId).toBe(userId1);
    expect(res.body.data.recipientId).toBe(userId2);
    messageId = res.body.data.idMessage;
  });

  it('récupère les conversations', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `conv1_${timestamp}@test.com`;
    const user2Email = `conv2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `conv1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const user1Id = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `conv2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const user2Id = registerRes2.body.data.user.idUser;

    // Se connecter avec le premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // D'abord envoyer un message
    await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test conversation',
        recipientId: user2Id,
      });

    const res = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("récupère les messages d'une conversation", async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `conv3_${timestamp}@test.com`;
    const user2Email = `conv4_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `conv3_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const user1Id = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `conv4_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const user2Id = registerRes2.body.data.user.idUser;

    // Se connecter avec le premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // D'abord envoyer un message
    await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test conversation',
        recipientId: user2Id,
      });

    const res = await request(app)
      .get(`/api/v1/messages/conversation/${user2Id}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toBeDefined();
    expect(res.body.data.otherUser).toBeDefined();
  });

  it('récupère un message par ID', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `msg1_${timestamp}@test.com`;
    const user2Email = `msg2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msg1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const user1Id = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `msg2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const user2Id = registerRes2.body.data.user.idUser;

    // Se connecter avec le premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // D'abord envoyer un message
    const messageRes = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: user2Id,
      });
    const testMessageId = messageRes.body.data.idMessage;

    const res = await request(app)
      .get(`/api/v1/messages/${testMessageId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.idMessage).toBe(testMessageId);
  });

  it('marque un message comme lu', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `read1_${timestamp}@test.com`;
    const user2Email = `read2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `read1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const user1Id = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `read2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const user2Id = registerRes2.body.data.user.idUser;

    // Se connecter avec les deux utilisateurs
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user2Email, password });
    expect(loginRes2.statusCode).toBe(200);
    const token2 = loginRes2.body.data.token;

    // D'abord envoyer un message
    const messageRes = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: user2Id,
      });
    const testMessageId = messageRes.body.data.idMessage;

    const res = await request(app)
      .patch(`/api/v1/messages/${testMessageId}/read`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
  });

  it('récupère le nombre de messages non lus', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `unread1_${timestamp}@test.com`;
    const user2Email = `unread2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `unread1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const user1Id = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `unread2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const user2Id = registerRes2.body.data.user.idUser;

    // Se connecter avec les deux utilisateurs
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    const loginRes2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user2Email, password });
    expect(loginRes2.statusCode).toBe(200);
    const token2 = loginRes2.body.data.token;

    // D'abord envoyer un message
    await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: user2Id,
      });

    const res = await request(app)
      .get('/api/v1/messages/unread/count')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.unreadCount).toBe('number');
  });

  it('supprime un message', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `del1_${timestamp}@test.com`;
    const user2Email = `del2_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `del1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const userId1 = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `del2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const userId2 = registerRes2.body.data.user.idUser;

    // Se connecter avec le premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // Envoyer un message
    const messageRes = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: userId2,
      });
    expect(messageRes.statusCode).toBe(201);
    const messageId = messageRes.body.data.idMessage;

    // Supprimer le message
    const res = await request(app)
      .delete(`/api/v1/messages/${messageId}`)
      .set('Authorization', `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('erreur envoi sans champs requis', async () => {
    // Créer un utilisateur pour ce test
    const timestamp = Date.now();
    const userEmail = `req_${timestamp}@test.com`;
    const password = 'Test1234!';

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `req_${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmail,
        password,
      });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password });
    expect(loginRes.statusCode).toBe(200);
    const token1 = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: 'Test' }); // Manque recipientId
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur envoi à soi-même', async () => {
    // Créer un utilisateur pour ce test
    const timestamp = Date.now();
    const userEmail = `self_${timestamp}@test.com`;
    const password = 'Test1234!';

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `self_${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmail,
        password,
      });
    expect(registerRes.statusCode).toBe(201);
    const userId1 = registerRes.body.data.user.idUser;

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password });
    expect(loginRes.statusCode).toBe(200);
    const token1 = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test',
        recipientId: userId1,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('erreur destinataire inexistant', async () => {
    // Créer un utilisateur pour ce test
    const timestamp = Date.now();
    const userEmail = `dest_${timestamp}@test.com`;
    const password = 'Test1234!';

    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `dest_${timestamp}`,
        firstname: 'User',
        lastname: 'Test',
        email: userEmail,
        password,
      });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password });
    expect(loginRes.statusCode).toBe(200);
    const token1 = loginRes.body.data.token;

    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test',
        recipientId: '00000000-0000-0000-0000-000000000000',
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('erreur accès message sans authentification', async () => {
    const res = await request(app).get('/api/v1/messages/test-id');
    expect(res.statusCode).toBe(401);
  });

  it('erreur accès message non autorisé', async () => {
    // Créer deux utilisateurs uniques pour ce test
    const timestamp = Date.now();
    const user1Email = `auth1_${timestamp}@test.com`;
    const user2Email = `auth2_${timestamp}@test.com`;
    const user3Email = `auth3_${timestamp}@test.com`;
    const password = 'Test1234!';

    // Créer le premier utilisateur (expéditeur)
    const registerRes1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `auth1_${timestamp}`,
        firstname: 'User',
        lastname: 'One',
        email: user1Email,
        password,
      });
    expect(registerRes1.statusCode).toBe(201);
    const userId1 = registerRes1.body.data.user.idUser;

    // Créer le deuxième utilisateur (destinataire)
    const registerRes2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `auth2_${timestamp}`,
        firstname: 'User',
        lastname: 'Two',
        email: user2Email,
        password,
      });
    expect(registerRes2.statusCode).toBe(201);
    const userId2 = registerRes2.body.data.user.idUser;

    // Créer le troisième utilisateur (non autorisé)
    const registerRes3 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        nameTag: `auth3_${timestamp}`,
        firstname: 'User',
        lastname: 'Three',
        email: user3Email,
        password,
      });
    expect(registerRes3.statusCode).toBe(201);

    // Se connecter avec le premier utilisateur
    const loginRes1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user1Email, password });
    expect(loginRes1.statusCode).toBe(200);
    const token1 = loginRes1.body.data.token;

    // Se connecter avec le troisième utilisateur
    const loginRes3 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user3Email, password });
    expect(loginRes3.statusCode).toBe(200);
    const token3 = loginRes3.body.data.token;

    // Envoyer un message du premier au deuxième utilisateur
    const messageRes = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        content: 'Test message',
        recipientId: userId2,
      });
    expect(messageRes.statusCode).toBe(201);
    const messageId = messageRes.body.data.idMessage;

    // Essayer d'accéder au message avec le troisième utilisateur
    const res = await request(app)
      .get(`/api/v1/messages/${messageId}`)
      .set('Authorization', `Bearer ${token3}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
