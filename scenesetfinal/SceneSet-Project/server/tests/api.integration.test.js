process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testing-secret-keep-at-least-thirty-two-characters-long';
process.env.CLIENT_URL = 'http://localhost:5173';

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');

let memory;
let app;
let owner;
let guest;
let planId;
let dateOptionId;
let placeOptionId;
let ownerAgent;
let guestAgent;

test('SceneSet API integration', async (t) => {
  memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri());
  app = createApp();
  ownerAgent = request.agent(app);
  guestAgent = request.agent(app);

  await t.test('health endpoint responds', async () => {
    const response = await request(app).get('/api/health').expect(200);
    assert.equal(response.body.status, 'ok');
  });

  await t.test('register creates an account without returning its password hash', async () => {
    const response = await ownerAgent.post('/api/auth/register').send({ name: 'Sai Planner', email: 'sai@example.com', password: 'Password123!' }).expect(201);
    owner = response.body.user;
    assert.equal(owner.email, 'sai@example.com');
    assert.equal('passwordHash' in owner, false);
    assert.ok(response.headers['set-cookie']);
  });

  await t.test('owner can create a plan with date and place options', async () => {
    const response = await ownerAgent.post('/api/plans').send({
      title: 'Weekend food crawl', description: 'A little treat after exams', eventType: 'food', budget: 1200, currency: 'INR',
      dateOptions: ['Saturday afternoon', 'Sunday brunch'], placeOptions: ['Noodle House', 'Seaside cafe']
    }).expect(201);
    planId = response.body.plan._id;
    dateOptionId = response.body.plan.dateOptions[0]._id;
    placeOptionId = response.body.plan.placeOptions[0]._id;
    assert.equal(response.body.plan.members.length, 1);
    assert.equal(response.body.plan.title, 'Weekend food crawl');
  });

  await t.test('a second member can join using a plan invite code', async () => {
    const register = await guestAgent.post('/api/auth/register').send({ name: 'Asha Guest', email: 'asha@example.com', password: 'GuestPass123!' }).expect(201);
    guest = register.body.user;
    const planResponse = await ownerAgent.get(`/api/plans/${planId}`).expect(200);
    const inviteCode = planResponse.body.plan.inviteCode;
    const joined = await guestAgent.post(`/api/plans/join/${inviteCode}`).expect(200);
    assert.equal(joined.body.planId, planId);
    const detail = await guestAgent.get(`/api/plans/${planId}`).expect(200);
    assert.equal(detail.body.plan.members.length, 2);
  });

  await t.test('member vote is saved and expense settlement is returned', async () => {
    await guestAgent.post(`/api/plans/${planId}/votes`).send({ category: 'date', optionId: dateOptionId }).expect(200);
    await guestAgent.post(`/api/plans/${planId}/votes`).send({ category: 'place', optionId: placeOptionId }).expect(200);
    await guestAgent.post(`/api/plans/${planId}/expenses`).send({ description: 'Shared snacks', amount: 300, category: 'food' }).expect(201);
    const detail = await ownerAgent.get(`/api/plans/${planId}`).expect(200);
    assert.equal(detail.body.expenses.length, 1);
    assert.equal(detail.body.settlement.length, 2);
    assert.equal(detail.body.settlement.reduce((sum, item) => sum + item.net, 0), 0);
    const dateOption = detail.body.plan.dateOptions.find((item) => item._id === dateOptionId);
    assert.equal(dateOption.voters.length, 1);
  });

  await t.test('non-members cannot access a plan', async () => {
    const anonymous = request.agent(app);
    await anonymous.get(`/api/plans/${planId}`).expect(401);
  });
});

test.after(async () => {
  await mongoose.disconnect();
  if (memory) await memory.stop();
});
