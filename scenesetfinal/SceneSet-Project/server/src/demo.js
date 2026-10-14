const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('./app');
const User = require('./models/User');
const Plan = require('./models/Plan');
const Expense = require('./models/Expense');
const Notification = require('./models/Notification');

const DEMO_EMAIL = 'demo@sceneset.app';
const DEMO_PASSWORD = 'SceneSetDemo2026!';
const DAY_MS = 24 * 60 * 60 * 1000;

function futureDate(days, hour = 12) {
  const date = new Date(Date.now() + days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function pastDate(days, hour = 12) {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function seedDemoData() {
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const demoUser = await User.create({
    name: 'Aarav Mehta',
    email: DEMO_EMAIL,
    passwordHash: demoPasswordHash,
    avatarColor: '#287a60'
  });
  const friendPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
  const friends = await User.create([
    { name: 'Riya Kapoor', email: 'riya.demo@example.com', passwordHash: friendPasswordHash, avatarColor: '#e58b56' },
    { name: 'Kabir Shah', email: 'kabir.demo@example.com', passwordHash: friendPasswordHash, avatarColor: '#5375a3' },
    { name: 'Neha Iyer', email: 'neha.demo@example.com', passwordHash: friendPasswordHash, avatarColor: '#ba6f81' }
  ]);
  const [riya, kabir, neha] = friends;

  const plans = await Plan.create([
    {
      title: 'Sunday brunch club',
      description: 'A slow morning, good coffee, and absolutely no group-chat scheduling.',
      eventType: 'food',
      owner: demoUser._id,
      members: [
        { user: demoUser._id, role: 'owner' },
        { user: riya._id },
        { user: kabir._id }
      ],
      dateOptions: [
        { value: futureDate(3).toISOString(), voters: [demoUser._id, riya._id] },
        { value: futureDate(4).toISOString(), voters: [kabir._id] }
      ],
      placeOptions: [
        { value: 'Mango Tree Cafe', voters: [demoUser._id] },
        { value: 'The Flour Works', voters: [riya._id, kabir._id] }
      ],
      budget: 4500,
      currency: 'INR',
      status: 'planning'
    },
    {
      title: 'Jaipur weekend escape',
      description: 'Two days for old-city walks, rooftop sunsets, and too much pyaaz kachori.',
      eventType: 'trip',
      owner: demoUser._id,
      members: [
        { user: demoUser._id, role: 'owner' },
        { user: riya._id },
        { user: kabir._id },
        { user: neha._id }
      ],
      dateOptions: [{ value: futureDate(12).toISOString(), voters: [demoUser._id, riya._id, kabir._id, neha._id] }],
      placeOptions: [{ value: 'Jaipur, Rajasthan', voters: [demoUser._id, riya._id, kabir._id, neha._id] }],
      budget: 24000,
      currency: 'INR',
      status: 'confirmed',
      itinerary: [
        { title: 'Check in and chai', location: 'Hawa Mahal area', startsAt: futureDate(12, 14), note: 'Drop bags, then find chai.', createdBy: demoUser._id },
        { title: 'Sunset at Nahargarh', location: 'Nahargarh Fort', startsAt: futureDate(12, 17), note: 'Leave before the evening traffic.', createdBy: riya._id }
      ]
    },
    {
      title: 'Rooftop movie night',
      description: 'Projector, blankets, popcorn, and a vote on the movie.',
      eventType: 'movie',
      owner: demoUser._id,
      members: [
        { user: demoUser._id, role: 'owner' },
        { user: kabir._id },
        { user: neha._id }
      ],
      dateOptions: [
        { value: futureDate(7).toISOString(), voters: [demoUser._id, neha._id] },
        { value: futureDate(8).toISOString(), voters: [kabir._id] }
      ],
      placeOptions: [
        { value: 'Kabir’s rooftop', voters: [demoUser._id, kabir._id] },
        { value: 'Neha’s terrace', voters: [neha._id] }
      ],
      budget: 3000,
      currency: 'INR',
      status: 'planning',
      itinerary: [
        { title: 'Set up the projector', location: 'Kabir’s rooftop', startsAt: futureDate(7, 18), note: 'Bring the HDMI adapter.', createdBy: kabir._id }
      ]
    },
    {
      title: 'Riya’s rooftop birthday',
      description: 'A tiny birthday dinner that turned into a very good night.',
      eventType: 'birthday',
      owner: demoUser._id,
      members: [
        { user: demoUser._id, role: 'owner' },
        { user: riya._id },
        { user: kabir._id },
        { user: neha._id }
      ],
      dateOptions: [{ value: pastDate(10).toISOString(), voters: [demoUser._id, riya._id, kabir._id, neha._id] }],
      placeOptions: [{ value: 'Riya’s rooftop', voters: [demoUser._id, riya._id, kabir._id, neha._id] }],
      budget: 8000,
      currency: 'INR',
      status: 'completed',
      itinerary: [
        { title: 'Dinner and cake', location: 'Riya’s rooftop', startsAt: pastDate(10, 19), note: 'Bring the chocolate cake from the bakery.', createdBy: demoUser._id },
        { title: 'Birthday toast', location: 'Riya’s rooftop', startsAt: pastDate(10, 21), note: 'A toast to another trip around the sun.', createdBy: neha._id }
      ]
    }
  ]);

  await Expense.create([
    { plan: plans[0]._id, description: 'Coffee and pastries', category: 'food', amount: 780, paidBy: riya._id, createdBy: demoUser._id },
    { plan: plans[1]._id, description: 'Train tickets', category: 'travel', amount: 6400, paidBy: demoUser._id, createdBy: demoUser._id },
    { plan: plans[1]._id, description: 'Guesthouse deposit', category: 'stay', amount: 5200, paidBy: kabir._id, createdBy: demoUser._id },
    { plan: plans[2]._id, description: 'Popcorn and snacks', category: 'food', amount: 560, paidBy: neha._id, createdBy: demoUser._id },
    { plan: plans[3]._id, description: 'Birthday dinner', category: 'food', amount: 4680, paidBy: demoUser._id, createdBy: demoUser._id },
    { plan: plans[3]._id, description: 'Birthday cake', category: 'food', amount: 1250, paidBy: riya._id, createdBy: demoUser._id }
  ]);
  await Notification.create([
    { user: demoUser._id, type: 'vote_cast', title: 'A vote just came in', message: 'Riya voted on date options for “Sunday brunch club”.', plan: plans[0]._id },
    { user: demoUser._id, type: 'plan_updated', title: 'Plan details updated', message: '“Jaipur weekend escape” is confirmed.', plan: plans[1]._id },
    { user: demoUser._id, type: 'itinerary_added', title: 'Itinerary updated', message: 'Kabir added “Set up the projector” to “Rooftop movie night”.', plan: plans[2]._id }
  ]);
}

async function startDemo() {
  process.env.NODE_ENV = 'development';
  process.env.JWT_SECRET = 'sceneset-local-demo-secret-not-for-production';
  process.env.CLIENT_URL = 'http://localhost:5173,http://localhost:5174';

  const memory = await MongoMemoryServer.create();
  await mongoose.connect(memory.getUri());
  await seedDemoData();

  const port = Number(process.env.PORT || 5000);
  const server = createApp().listen(port, () => {
    console.log(`SceneSet demo API listening on http://localhost:${port}`);
    console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    console.log('Demo database is temporary and resets when this process stops.');
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await memory.stop();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startDemo().catch((error) => {
  console.error('Could not start SceneSet demo:', error.message);
  process.exitCode = 1;
});